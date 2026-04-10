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
const nodemailer = require('nodemailer'); // NEW: Nodemailer

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
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json()); 

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

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

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15, 
    message: "Too many AI requests. Please try again later."
});

const upload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type.'));
    }
});

// Database
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// NEW: Updated Profile Schema
const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    generatedProfile: { type: Object, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', ProfileSchema);

// Route: Analyze Documents 
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

        // NEW: Kenyan Market Alignment Prompt
        const aiPrompt = `
You are an expert tech recruiter and career strategist based in Nairobi, Kenya (familiar with the Silicon Savannah, local tech hubs, and the Kenyan job market). 
Analyze the following academic coursework and extract the student's profile.

Strictly return ONLY a valid JSON object matching this exact structure:
{
  "bio": "A 2-sentence professional summary.",
  "skills": {
    "technical": ["Skill 1", "Skill 2", "Skill 3"],
    "soft": ["Skill A", "Skill B"]
  },
  "kenyan_market_alignment": "A 2-sentence analysis of how these skills fit into the current Kenyan job market (e.g., demand in Nairobi tech hubs, NGOs, Safaricom, local startups).",
  "recommended_role": {
    "title": "e.g., Junior Data Analyst",
    "description": "What this role entails."
  },
  "marketable_services": [
    { 
      "service_name": "Name of freelance/consulting service", 
      "demand_score": 85, 
      "description": "How they provide value" 
    }
  ]
}

Combined Document Text:
"""${combinedText.substring(0, 15000)}"""
`;

        console.log("Sending text to Groq API...");

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert career advisor. You must reply strictly in valid JSON format." },
                { role: "user", content: aiPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
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
        console.error('❌ Error:', error);
        res.status(500).send('Analysis failed.');
    } finally {
        req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); }); 
    }
});

// Route: Fetch History
app.get('/api/user-history', verifyAuth, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        res.json({ history });
    } catch (e) { res.status(500).send('History error.'); }
});

// Route: Synthesize Profile 
app.post('/api/synthesize-profile', verifyAuth, aiLimiter, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need 2+ documents.");

        const pastProfiles = history.map(doc => doc.generatedProfile);
        const synthesisPrompt = `Synthesize these analyses into ONE master JSON profile matching the input structure strictly: ${JSON.stringify(pastProfiles)}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: synthesisPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const masterProfile = JSON.parse(jsonrepair(completion.choices[0].message.content));
        res.json(masterProfile);
    } catch (e) { res.status(500).send('Synthesis failed.'); }
});

// NEW: AI Job Matching API
app.post('/api/match-job', verifyAuth, async (req, res) => {
    const { jobDescription } = req.body;

    // Fetch recent student profiles
    const candidates = await Profile.find().sort({ createdAt: -1 }).limit(50);
    const candidateData = candidates.map(c => ({ id: c._id, email: c.userEmail, profile: c.generatedProfile }));

    const matchPrompt = `
    You are an AI Recruitment Engine. Read the following Job Description and the list of student profiles.
    Find the top 3 best-matching students. 
    Return strictly JSON: { "matches": [ { "candidateId": "id_here", "email": "email_here", "matchPercentage": 90, "reason": "Short reason" } ] }
    
    Job Description: ${jobDescription}
    Candidates: ${JSON.stringify(candidateData)}
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: matchPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (error) {
        console.error(error);
        res.status(500).send('Matching failed.');
    }
});

// NEW: Automated Outreach API
app.post('/api/send-offer', verifyAuth, async (req, res) => {
    const { candidateEmail, roleTitle, message } = req.body;

    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: '"TU-K Talent Portal" <admin@tukenya.ac.ke>',
            to: candidateEmail,
            subject: `Interview Invitation: ${roleTitle}`,
            text: message
        });

        res.send({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).send('Email failed.');
    }
});

app.listen(5000, () => console.log(`🚀 Groq-Powered Backend on http://localhost:5000`));