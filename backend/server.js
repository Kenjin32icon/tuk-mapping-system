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
const rateLimit = require('express-rate-limit'); 
const nodemailer = require('nodemailer'); 

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
app.use(express.json()); 

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// --- DATABASE SCHEMAS ---
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// UPDATED SCHEMA: User Identity & RBAC & Settings
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
    phone: { type: String, default: '' },       // NEW: For Profile Settings
    portfolio: { type: String, default: '' },   // NEW: For Profile Settings
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
    message: "Too many AI analysis requests. Please try again later."
});

const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No token provided');
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).send('Unauthorized: Invalid token');
    }
};

const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const dbUser = await User.findOne({ firebaseUid: req.user.uid });
            if (!dbUser || !allowedRoles.includes(dbUser.role)) {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
            }
            req.dbUser = dbUser; 
            next();
        } catch (error) {
            res.status(500).json({ error: 'Failed to verify user role.' });
        }
    };
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only PDF and DOCX allowed.'));
    }
});

// --- ROUTES ---

// Auth Sync
app.post('/api/sync-user', verifyAuth, async (req, res) => {
    try {
        const { email, name } = req.user; 
        let dbUser = await User.findOne({ firebaseUid: req.user.uid });
        if (!dbUser) {
            const assignedRole = (email === 'kariukilewis04@students.tukenya.ac.ke') ? 'SUPER_ADMIN' : 'STUDENT';
            dbUser = new User({
                firebaseUid: req.user.uid,
                email: email,
                name: name || 'User',
                role: assignedRole
            });
            await dbUser.save();
        }
        res.json({ role: dbUser.role, institution: dbUser.institution });
    } catch (error) { res.status(500).send('Error syncing user.'); }
});

// NEW: Get User Settings
app.get('/api/user-settings', verifyAuth, async (req, res) => {
    try {
        const dbUser = await User.findOne({ firebaseUid: req.user.uid });
        res.json({ phone: dbUser?.phone || '', portfolio: dbUser?.portfolio || '' });
    } catch (error) { res.status(500).send('Error fetching settings'); }
});

// NEW: Update User Settings
app.post('/api/update-settings', verifyAuth, async (req, res) => {
    try {
        const { phone, portfolio } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: req.user.uid },
            { phone, portfolio },
            { new: true }
        );
        res.json({ success: true, phone: updatedUser.phone, portfolio: updatedUser.portfolio });
    } catch (error) { res.status(500).send('Error updating settings'); }
});

// AI Analysis Routes
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
    } catch (error) { res.status(500).send('Analysis failed.'); }
    finally { req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); }); }
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
        res.json(JSON.parse(jsonrepair(completion.choices[0].message.content)));
    } catch (e) { res.status(500).send('Synthesis failed.'); }
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

app.listen(5000, () => console.log(`🚀 Secure Role-Based Backend running on http://localhost:5000`));
