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
const rateLimit = require('express-rate-limit'); // ✅ FIX: Added missing import

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- INTELLIGENT FIREBASE AUTHENTICATION ---
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // If running on Render (Production)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    // If running on Localhost (Development)
    serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5000', 'https://tuk-frontend-web.vercel.app'], 
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
app.use(express.json()); 

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// --- DATABASE SCHEMAS ---
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuk-mapping';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
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
    userEmail: { type: String, required: true },
    userName: { type: String },
    generatedProfile: { type: Object, required: true }, 
    createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

// --- MIDDLEWARE ---
const aiLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: "Too many AI requests." 
});

const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) { res.status(403).send('Unauthorized'); }
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- ROUTES ---
app.post('/api/sync-user', verifyAuth, async (req, res) => {
    try {
        const { email, name } = req.user; 
        let dbUser = await User.findOne({ firebaseUid: req.user.uid });
        if (!dbUser) {
            const assignedRole = (email === 'kariukilewis04@students.tukenya.ac.ke') ? 'SUPER_ADMIN' : 'STUDENT';
            dbUser = new User({ firebaseUid: req.user.uid, email, name: name || 'User', role: assignedRole });
            await dbUser.save();
        }
        res.json({ role: dbUser.role, institution: dbUser.institution });
    } catch (error) { res.status(500).send('Error syncing user.'); }
});

app.get('/api/user-settings', verifyAuth, async (req, res) => {
    try {
        const dbUser = await User.findOne({ firebaseUid: req.user.uid });
        res.json({ phone: dbUser?.phone || '', portfolio: dbUser?.portfolio || '' });
    } catch (error) { res.status(500).send('Error fetching settings'); }
});

app.post('/api/update-settings', verifyAuth, async (req, res) => {
    try {
        const { phone, portfolio } = req.body;
        const updatedUser = await User.findOneAndUpdate({ firebaseUid: req.user.uid }, { phone, portfolio }, { new: true });
        res.json({ success: true, phone: updatedUser.phone, portfolio: updatedUser.portfolio });
    } catch (error) { res.status(500).send('Error updating settings'); }
});

app.get('/api/admin/students', verifyAuth, requireRole(['SUPER_ADMIN', 'UNIVERSITY_ADMIN']), async (req, res) => {
    try {
        const students = await User.find({ role: 'STUDENT', masterProfile: { $ne: null } }).sort({ createdAt: -1 });
        const studentData = students.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.masterProfile?.recommended_role?.title || 'Unassigned',
            readiness: u.masterProfile?.kenyan_market_alignment?.market_readiness_score || 0,
            bestSector: u.masterProfile?.kenyan_market_alignment?.best_skill_area_expertise || 'N/A',
            date: u.createdAt
        }));
        res.json(studentData);
    } catch (error) { res.status(500).send('Failed to fetch student directory.'); }
});

app.post('/api/analyze-data', verifyAuth, aiLimiter, upload.array('documents', 5), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send('No files uploaded.');
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
        const aiPrompt = `You are an expert tech recruiter in Nairobi. Analyze the coursework and extract the student's profile.
        Strictly return a valid JSON object matching this structure:
        { "bio": "...", "skills": { "technical": [], "soft": [] }, "kenyan_market_alignment": { "best_skill_area_expertise": "...", "description": "...", "service_potentiality_score": 85 }, "recommended_role": { "title": "...", "description": "..." }, "marketable_services": [ { "service_name": "...", "demand_score": 90, "description": "..." } ] }
        Combined Text: ${combinedText.substring(0, 15000)}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: "Reply strictly in JSON." }, { role: "user", content: aiPrompt }],
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
        res.status(500).json({ error: 'Analysis failed. Please ensure your documents contain readable text and try again.' }); 
    } finally { 
        req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); }); 
    }
});

app.post('/api/synthesize-profile', verifyAuth, aiLimiter, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need 2+ documents.");
        
        const pastProfiles = history.map(doc => doc.generatedProfile);
        const synthesisPrompt = `You are an elite Career Strategist in Nairobi. Synthesize these analyses into ONE master profile.
        Strictly output JSON: { "bio": "...", "skills": { "technical": [], "soft": [], "transferable": [] }, "kenyan_market_alignment": { "best_skill_area_expertise": "...", "description": "...", "service_potentiality_score": 85, "market_readiness_score": 78, "skill_scarcity_index": "High" }, "sector_demand": [ { "sector": "FinTech", "demand_percentage": 90 } ], "recommended_role": { "title": "...", "description": "..." }, "marketable_services": [ { "service_name": "...", "demand_score": 90, "description": "..." } ] }
        Data: ${JSON.stringify(pastProfiles)}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: synthesisPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.4,
            response_format: { type: "json_object" }
        });
        
        const consolidatedProfile = JSON.parse(jsonrepair(completion.choices[0].message.content));
        
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: req.user.uid }, 
            { masterProfile: consolidatedProfile },
            { new: true } 
        );

        syncToGoogleSheets(updatedUser).catch(err => console.error("Google Sheets Sync failed:", err));

        res.json(consolidatedProfile);
    } catch (e) { 
        console.error(e);
        res.status(500).send('Synthesis failed.'); 
    }
});

app.post('/api/generate-portfolio', verifyAuth, aiLimiter, async (req, res) => {
    const { masterProfile, serviceName, serviceDescription } = req.body;
    const portfolioPrompt = `
    You are an expert tech recruiter in Kenya. The user wants to offer: "${serviceName}" (${serviceDescription}).
    Master Profile: ${JSON.stringify(masterProfile)}
    Design a targeted 3-project portfolio framework.
    Strictly output JSON: { "portfolio_title": "...", "targeted_bio": "...", "value_proposition": "...", "projects": [ { "project_name": "...", "problem_statement": "...", "tech_stack": [], "features": [], "github_readme_pitch": "..." } ], "freelance_platform_tags": [] }
    `;
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: portfolioPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.4,
            response_format: { type: "json_object" }
        });
        res.json(JSON.parse(jsonrepair(completion.choices[0].message.content)));
    } catch (error) { res.status(500).send('Portfolio generation failed.'); }
});

app.post('/api/match-job', verifyAuth, requireRole(['SUPER_ADMIN', 'UNIVERSITY_ADMIN']), async (req, res) => {
    const { jobDescription } = req.body;
    const students = await User.find({ role: 'STUDENT', masterProfile: { $ne: null } });
    const candidateData = students.map(u => ({ id: u._id, email: u.email, name: u.name, profile: u.masterProfile }));

    const matchPrompt = `You are an AI Recruitment Engine. Find top 3 best-matching students for this job. Return JSON: { "matches": [ { "candidateId": "id_here", "name": "name_here", "email": "email_here", "matchPercentage": 90, "reason": "Short reason why they fit" } ] }
    Job Description: ${jobDescription}\nCandidates: ${JSON.stringify(candidateData)}`;
    
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: matchPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (error) { res.status(500).send('Matching failed.'); }
});

// --- GOOGLE SHEETS SYNC ---
async function syncToGoogleSheets(studentData) {
    if (!process.env.GOOGLE_SHEETS_KEY || !process.env.SPREADSHEET_ID) return;
    try {
        const sheetCredentials = JSON.parse(process.env.GOOGLE_SHEETS_KEY);
        sheetCredentials.private_key = sheetCredentials.private_key.replace(/\\n/g, '\n');
        
        const auth = new google.auth.GoogleAuth({
            credentials: sheetCredentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const sheets = google.sheets({ version: 'v4', auth });
        
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
app.listen(PORT, () => console.log(`🚀 Secure Role-Based Backend running on port ${PORT}`));