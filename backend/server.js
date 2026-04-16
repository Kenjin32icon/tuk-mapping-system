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

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// --- DATABASE SCHEMAS ---

mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// NEW SCHEMA: User Identity & RBAC
const UserSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    role: { 
        type: String, 
        enum: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'GOVT_ADMIN', 'STUDENT'],
        default: 'STUDENT' // Everyone is a student by default
    },
    institution: { type: String, default: 'Unassigned' },
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

// Middleware: Role-Based Access Control
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // req.user is set by verifyAuth middleware
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
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

// --- API ROUTES ---

// Route: Sync User and Get Role
app.post('/api/sync-user', verifyAuth, async (req, res) => {
    try {
        const { email, name } = req.user; 
        let dbUser = await User.findOne({ firebaseUid: req.user.uid });
        
        if (!dbUser) {
            // Assign SUPER_ADMIN role to specific developer email
            const assignedRole = (email === 'kariukilewis04@students.tukenya.ac.ke') 
                ? 'SUPER_ADMIN' 
                : 'STUDENT';

            dbUser = new User({
                firebaseUid: req.user.uid,
                email: email,
                name: name || 'User',
                role: assignedRole
            });
            await dbUser.save();
        }

        res.json({ role: dbUser.role, institution: dbUser.institution });
    } catch (error) {
        res.status(500).send('Error syncing user.');
    }
});

// Protected Route: Job Matching (Only for Admin roles)
app.post('/api/match-job', verifyAuth, requireRole(['SUPER_ADMIN', 'UNIVERSITY_ADMIN']), async (req, res) => {
    const { jobDescription } = req.body;
    try {
        const candidates = await Profile.find().sort({ createdAt: -1 }).limit(50);
        const candidateData = candidates.map(c => ({ id: c._id, email: c.userEmail, profile: c.generatedProfile }));

        const matchPrompt = `Find top 3 matches for: ${jobDescription}. Data: ${JSON.stringify(candidateData)}`;
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: matchPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) { res.status(500).send('Matching failed.'); }
});

app.post('/api/generate-portfolio', verifyAuth, aiLimiter, async (req, res) => {
    const { masterProfile, serviceName, serviceDescription } = req.body;
    const portfolioPrompt = `Recruiter Persona. Design 3 projects for: "${serviceName}". Profile: ${JSON.stringify(masterProfile)}. Strictly valid JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: portfolioPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.4,
            response_format: { type: "json_object" }
        });
        const portfolioData = JSON.parse(jsonrepair(completion.choices[0].message.content));
        res.json(portfolioData);
    } catch (error) { res.status(500).send('Portfolio generation failed.'); }
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

        const aiPrompt = `Analyze student profile: ${combinedText.substring(0, 15000)}`;
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
        const synthesisPrompt = `Synthesize profiles: ${JSON.stringify(pastProfiles)}`;
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: synthesisPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        res.json(JSON.parse(jsonrepair(completion.choices[0].message.content)));
    } catch (e) { res.status(500).send('Synthesis failed.'); }
});

app.listen(5000, () => console.log(`🚀 Server on http://localhost:5000`));
