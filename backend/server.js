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

// Initialize Firebase Admin using Env Var for production/local flexibility
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();

// CORRECTION: Dynamic CORS for Vercel and Local Dev
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
app.use(express.json());

// --- DATABASE CONNECTION ---
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuk-mapping';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB error:', err));

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
    generatedProfile: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

// --- GOOGLE SHEETS SYNC LOGIC ---
async function syncToGoogleSheets(studentData) {
    try {
        const authSheets = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SHEETS_KEY),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const sheets = google.sheets({ version: 'v4', auth: authSheets });
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet1!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    studentData.name, 
                    studentData.email, 
                    studentData.masterProfile?.recommended_role?.title || 'N/A', 
                    studentData.masterProfile?.kenyan_market_alignment?.market_readiness_score || 0,
                    new Date().toLocaleDateString()
                ]]
            }
        });
    } catch (e) { console.error('⚠️ Google Sheets Sync Failed:', e.message); }
}

// --- MIDDLEWARE ---
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) { res.status(403).send('Invalid Token'); }
};

const upload = multer({ dest: 'uploads/' });

// --- ROUTES ---

// Unified User Profile/Sync Endpoint
app.get('/api/user-profile', verifyAuth, async (req, res) => {
    try {
        let dbUser = await User.findOne({ firebaseUid: req.user.uid });
        if (!dbUser) {
            // Role assignment logic (Example: hardcoded admin for specific email)
            const assignedRole = (req.user.email === 'kariukilewis04@students.tukenya.ac.ke') ? 'SUPER_ADMIN' : 'STUDENT';
            dbUser = new User({ 
                firebaseUid: req.user.uid, 
                email: req.user.email, 
                name: req.user.name || 'User', 
                role: assignedRole 
            });
            await dbUser.save();
        }
        res.json({ 
            role: dbUser.role, 
            masterProfile: dbUser.masterProfile, 
            phone: dbUser.phone, 
            portfolio: dbUser.portfolio 
        });
    } catch (error) { res.status(500).send('Error syncing profile.'); }
});

app.post('/api/analyze-data', verifyAuth, aiLimiter, upload.array('documents', 5), async (req, res) => {
    try {
        let combinedText = "";
        for (const file of req.files) {
            const data = file.mimetype === 'application/pdf' ? await pdfParse(fs.readFileSync(file.path)) : await mammoth.extractRawText({ path: file.path });
            combinedText += `\n--- DOC: ${file.originalname} ---\n${data.text || data.value}`;
            fs.unlinkSync(file.path);
        }
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: "Analyze student profile. Reply strictly in JSON." }, { role: "user", content: combinedText.substring(0, 15000) }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const generatedProfile = JSON.parse(jsonrepair(completion.choices[0].message.content));
        await new Profile({ userId: req.user.uid, generatedProfile }).save();
        res.json(generatedProfile);
    } catch (error) { res.status(500).send('Analysis failed.'); }
});

app.post('/api/synthesize-profile', verifyAuth, aiLimiter, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need 2+ documents.");

        const synthesisPrompt = `Synthesize these into ONE master profile for Nairobi market: ${JSON.stringify(history.map(h => h.generatedProfile))}`;
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

        // Trigger Google Sheets Sync
        await syncToGoogleSheets(updatedUser);

        res.json(consolidatedProfile);
    } catch (e) { res.status(500).send('Synthesis failed.'); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Production Server live on port ${PORT}`));