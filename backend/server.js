// server.js
// ============================================================================
// 1. IMPORTS & SYSTEM CONFIGURATION
// ============================================================================
const express = require('express');
const multer = require('multer');          
const fs = require('fs');                  
const path = require('path');              
const pdfParse = require('pdf-parse');     
const axios = require('axios');            
const cors = require('cors');              
const mongoose = require('mongoose');      
const mammoth = require('mammoth');        
const { jsonrepair } = require('jsonrepair'); 
const admin = require('firebase-admin');     // NEW: Firebase Admin SDK
const rateLimit = require('express-rate-limit'); // NEW: Rate Limiting

// Initialize Firebase Admin
//const admin = require('firebase-admin');
// const serviceAccount = require
const serviceAccount = require("./serviceAccountKey.json");
// admin.initializeApp
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

// Updated CORS: Strict Origins
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json()); 

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ============================================================================
// 2. MIDDLEWARE & UTILITIES
// ============================================================================

// NEW: Authentication Middleware
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No token provided');
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken; // Verified user attached to request
        next();
    } catch (error) {
        return res.status(403).send('Unauthorized: Invalid token');
    }
};

// NEW: Rate Limiting for AI Endpoints
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, 
    message: "Too many requests. Please try again in 15 minutes."
});

// UPGRADE: Strict Multer Constraints
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5 MB limit
        files: 5 
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
        }
    }
});

// ============================================================================
// 3. DATABASE CONNECTION
// ============================================================================
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },      
    userEmail: { type: String, required: true },
    userName: { type: String },                    
    documentsAnalyzed: [{ type: String }],         
    generatedProfile: { type: Object, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', ProfileSchema);

// ============================================================================
// 4. PROTECTED ROUTES
// ============================================================================

// Multi-Document Analysis with Auth, Limits, and Cleanup
app.post('/api/analyze-data', verifyAuth, aiLimiter, upload.array('documents', 5), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send('No documents.');

    try {
        let combinedText = "";
        const processedFileNames = [];

        for (const file of req.files) {
            processedFileNames.push(file.originalname);
            let extractedText = "";
            if (file.mimetype === 'application/pdf') {
                const pdfData = await pdfParse(fs.readFileSync(file.path));
                extractedText = pdfData.text;
            } else {
                const docxData = await mammoth.extractRawText({ path: file.path });
                extractedText = docxData.value;
            }
            combinedText += `\n--- DOC: ${file.originalname} ---\n${extractedText}`;
        }

        const aiPrompt = `Analyze student coursework text and return JSON: { "bio": "", "acquired_skills": [], "soft_skills": [], "marketable_services": [], "employability_score": 0 } \nText: ${combinedText.substring(0, 10000)}`;

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2',
            prompt: aiPrompt,
            stream: false
        });

        const generatedProfile = JSON.parse(jsonrepair(response.data.response));
        const newProfile = new Profile({
            userId: req.user.uid, // From Verified Token
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            documentsAnalyzed: processedFileNames,
            generatedProfile
        });

        await newProfile.save();
        res.json(generatedProfile);

    } catch (error) {
        console.error('❌ Analysis Error:', error.message);
        res.status(500).send('Error analyzing documents.');
    } finally {
        // NEW: Auto-Cleanup (Ephemeral Storage)
        req.files.forEach(file => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
    }
});

// Secure History Fetch
app.get('/api/user-history', verifyAuth, async (req, res) => {
    try {
        const userHistory = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        res.json({ history: userHistory });
    } catch (error) {
        res.status(500).send('Error fetching history.');
    }
});

// Secure Synthesis
app.post('/api/synthesize-profile', verifyAuth, aiLimiter, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need at least 2 documents.");

        const pastProfiles = history.map(doc => doc.generatedProfile);
        const synthesisPrompt = `Synthesize these analyses into one master JSON profile: ${JSON.stringify(pastProfiles)}`;

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2',
            prompt: synthesisPrompt,
            stream: false
        });

        res.json(JSON.parse(jsonrepair(response.data.response)));
    } catch (error) {
        res.status(500).send('Error synthesizing profile.');
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Secure Backend on http://localhost:${PORT}`));