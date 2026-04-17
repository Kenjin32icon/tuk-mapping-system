// server.js
require('dotenv').config(); 
const express = require('express');
const multer = require('multer');          
const fs = require('fs');                  
const path = require('path');              
const pdfParse = require('pdf-parse');     
const Groq = require('groq-sdk');          
const cors = require('cors');              
const mongoose = require('mongoose');      
const mammoth = require('mammoth');        
const { jsonrepair } = require('jsonrepair'); 
const admin = require('firebase-admin');     
const { google } = require('googleapis'); 
const rateLimit = require('express-rate-limit');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- RENDER DEPLOYMENT CRITICAL FIX: FIREBASE INIT ---
try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
    }
    
    // Fix Render newline escaping issue for private keys
    const rawFirebaseEnv = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n');
    const serviceAccount = JSON.parse(rawFirebaseEnv);
    
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin Initialized");
    }
} catch (error) {
    console.error("❌ Firebase Init Error:", error.message);
}

const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'https://tuk-talent-portal.vercel.app'].filter(Boolean), 
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
app.use(express.json()); 

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// --- DATABASE ---
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    console.error("❌ MONGODB_URI is not defined in environment variables.");
} else {
    mongoose.connect(mongoURI)
      .then(() => console.log('✅ Connected to MongoDB Atlas'))
      .catch(err => console.error('❌ MongoDB connection error:', err));
}

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    role: { 
        type: String, 
        enum: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'GOVT_ADMIN', 'STUDENT'],
        default: 'STUDENT'
    },
    institution: { type: String, default: 'Unassigned' },
    phone: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    masterProfile: { type: Object, default: null }, 
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    generatedProfile: { type: Object, required: true }, 
    createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

// --- MIDDLEWARE ---
const aiLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 15, 
    message: { error: "Too many requests. Please try again later." } 
});

const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) { 
        console.error("Auth Error:", error.message);
        res.status(403).send('Invalid Token'); 
    }
};

const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const dbUser = await User.findOne({ firebaseUid: req.user.uid });
            if (!dbUser || !allowedRoles.includes(dbUser.role)) return res.status(403).json({ error: 'Forbidden' });
            req.dbUser = dbUser; 
            next();
        } catch (error) { res.status(500).json({ error: 'Failed verification.' }); }
    };
};

const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// --- ROUTES ---

app.get('/', (req, res) => res.send("TUK Mapping API is Running")); // Health check for Render

app.post('/api/sync-user', verifyAuth, async (req, res) => {
    try {
        const { email, name } = req.user; 
        let dbUser = await User.findOne({ firebaseUid: req.user.uid });
        if (!dbUser) {
            const assignedRole = (email === 'kariukilewis04@students.tukenya.ac.ke') ? 'SUPER_ADMIN' : 'STUDENT';
            dbUser = new User({ firebaseUid: req.user.uid, email, name: name || 'User', role: assignedRole });
            await dbUser.save();
        }
        res.json({ role: dbUser.role, institution: dbUser.institution, masterProfile: dbUser.masterProfile });
    } catch (error) { res.status(500).send('Error syncing user.'); }
});

app.post('/api/analyze-data', verifyAuth, aiLimiter, upload.array('documents', 5), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send('No documents.');
    try {
        let combinedText = "";
        for (const file of req.files) {
            let text = "";
            if (file.mimetype === 'application/pdf') {
                const data = await pdfParse(fs.readFileSync(file.path));
                text = data.text;
            } else {
                const data = await mammoth.extractRawText({ path: file.path });
                text = data.value;
            }
            combinedText += `\n--- DOC: ${file.originalname} ---\n${text}`;
        }
        
        const aiPrompt = `Analyze this student profile and return a detailed JSON report. Focus on skills, potential career paths in Kenya, and market readiness: ${combinedText.substring(0, 12000)}`;
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: "Reply strictly in valid JSON." }, { role: "user", content: aiPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        
        const generatedProfile = JSON.parse(jsonrepair(completion.choices[0].message.content));
        const newProfile = new Profile({
            userId: req.user.uid,
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            generatedProfile
        });
        await newProfile.save();
        res.json(generatedProfile);
    } catch (error) { 
        console.error("Analysis Error: ", error);
        res.status(500).json({ error: 'Analysis failed.' }); 
    } finally { 
        // Handles Render's ephemeral storage cleanup successfully
        req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); }); 
    }
});

app.post('/api/synthesize-profile', verifyAuth, aiLimiter, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need at least 2 document analyses to synthesize.");
        
        const pastProfiles = history.map(doc => doc.generatedProfile);
        const synthesisPrompt = `Synthesize these analyses into ONE master profile for a student in Nairobi. Return JSON with 'recommended_role' (object with 'title') and 'kenyan_market_alignment' (object with 'market_readiness_score'). Data: ${JSON.stringify(pastProfiles)}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: synthesisPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        
        const consolidatedProfile = JSON.parse(jsonrepair(completion.choices[0].message.content));
        
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: req.user.uid }, 
            { masterProfile: consolidatedProfile },
            { new: true } 
        );

        // Run sync in background
        syncToGoogleSheets(updatedUser).catch(err => console.error("Sheets Sync Error:", err));

        res.json(consolidatedProfile);
    } catch (e) { 
        console.error(e);
        res.status(500).send('Synthesis failed.'); 
    }
});

// --- GOOGLE SHEETS SYNC FIX ---
async function syncToGoogleSheets(studentData) {
    if (!process.env.GOOGLE_SHEETS_KEY || !process.env.SPREADSHEET_ID) return;
    try {
        // Fix Render newline escaping issue for private keys
        const rawGoogleSheetsEnv = process.env.GOOGLE_SHEETS_KEY.replace(/\\n/g, '\n');
        
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(rawGoogleSheetsEnv),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Match the data structure from your synthesis prompt
        const role = studentData.masterProfile?.recommended_role?.title || "N/A";
        const score = studentData.masterProfile?.kenyan_market_alignment?.market_readiness_score || 0;

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet1!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[ studentData.name, studentData.email, role, score, new Date().toISOString() ]]
            }
        });
    } catch (e) { console.error('Sheets Sync Failed:', e.message); }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});