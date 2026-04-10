// server.js
require('dotenv').config(); // Loads GROQ_API_KEY from .env
const express = require('express');
const multer = require('multer');          
const fs = require('fs');                  
const path = require('path');              
const pdfParse = require('pdf-parse');     
const Groq = require('groq-sdk');          // NEW: Groq SDK
const cors = require('cors');              
const mongoose = require('mongoose');      
const mammoth = require('mammoth');        
const { jsonrepair } = require('jsonrepair'); 
const admin = require('firebase-admin');     
const rateLimit = require('express-rate-limit'); 

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Firebase Admin (Ensure serviceAccountKey.json is in your directory)
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

// Security: Strict CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json()); 

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Middleware: Firebase Auth Verification
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

const Profile = mongoose.model('Profile', new mongoose.Schema({
    userId: { type: String, required: true },      
    userEmail: { type: String, required: true },
    userName: { type: String },                    
    documentsAnalyzed: [{ type: String }],         
    generatedProfile: { type: Object, required: true }, 
    createdAt: { type: Date, default: Date.now }
}));

// Route: Analyze Documents (Now using Groq Llama 3.1 70B)
app.post('/api/analyze-data', verifyAuth, aiLimiter, upload.array('documents', 5), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send('No documents.');

    try {
        let combinedText = "";
        const processedFileNames = [];

        for (const file of req.files) {
            processedFileNames.push(file.originalname);
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

        const aiPrompt = `Analyze student coursework text and return JSON: { "professional_title": "", "bio": "", "acquired_skills": [], "soft_skills": [], "marketable_services": [{ "service_name": "", "description": "" }], "employability_score": 0 } \nText: ${combinedText.substring(0, 15000)}`;

        console.log("Sending text to Groq API...");

        // NEW GROQ IMPLEMENTATION
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
            documentsAnalyzed: processedFileNames,
            generatedProfile
        });

        await newProfile.save();
        res.json(generatedProfile);

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).send('Analysis failed.');
    } finally {
        req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); }); // Cleanup
    }
});

// Route: Fetch History
app.get('/api/user-history', verifyAuth, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        res.json({ history });
    } catch (e) { res.status(500).send('History error.'); }
});

// Route: Synthesize Profile (Now using Groq Llama 3.1 70B)
app.post('/api/synthesize-profile', verifyAuth, aiLimiter, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need 2+ documents.");

        const pastProfiles = history.map(doc => doc.generatedProfile);
        const synthesisPrompt = `Synthesize these analyses into ONE master JSON profile matching the input structure: ${JSON.stringify(pastProfiles)}`;

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

app.listen(5000, () => console.log(`🚀 Groq-Powered Backend on http://localhost:5000`));