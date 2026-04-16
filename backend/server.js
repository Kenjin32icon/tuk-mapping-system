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

mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    generatedProfile: { type: Object, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', ProfileSchema);

// NEW: Generate Targeted Portfolio Endpoint
app.post('/api/generate-portfolio', verifyAuth, aiLimiter, async (req, res) => {
    const { masterProfile, serviceName, serviceDescription } = req.body;

    const portfolioPrompt = `
    You are an expert tech recruiter and portfolio strategist in Nairobi, Kenya. 
    The user wants to offer the following service: "${serviceName}" (${serviceDescription}).
    Here is their verified Master Profile: ${JSON.stringify(masterProfile)}

    Design a highly targeted, 3-project portfolio framework that they must build to prove their competence in this specific service to Kenyan employers (e.g., Safaricom, Equity Bank, local startups, or international Upwork clients).

    Strictly output ONLY valid JSON matching this exact structure:
    {
      "portfolio_title": "e.g., Full-Stack E-Commerce Portfolio",
      "targeted_bio": "A 2-sentence bio optimized specifically for pitching this service.",
      "value_proposition": "Why a client should hire them for this service based on their skills.",
      "projects": [
        {
          "project_name": "Name of the project",
          "problem_statement": "The local Kenyan problem this project solves.",
          "tech_stack": ["Skill 1", "Skill 2"],
          "features": ["Feature 1", "Feature 2"],
          "github_readme_pitch": "A 1-sentence pitch for the GitHub repo"
        }
      ],
      "freelance_platform_tags": ["tag1", "tag2", "tag3"]
    }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: portfolioPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.4,
            response_format: { type: "json_object" }
        });
        
        const portfolioData = JSON.parse(jsonrepair(completion.choices[0].message.content));
        res.json(portfolioData);
    } catch (error) {
        console.error(error);
        res.status(500).send('Portfolio generation failed.');
    }
});

// Analyze Documents
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

        const aiPrompt = `Analyze the student profile and return JSON with bio, skills, kenyan_market_alignment, recommended_role, and marketable_services. Text: ${combinedText.substring(0, 15000)}`;

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

// Synthesize Master Profile
app.post('/api/synthesize-profile', verifyAuth, aiLimiter, async (req, res) => {
    try {
        const history = await Profile.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need 2+ documents.");
        const pastProfiles = history.map(doc => doc.generatedProfile);
        
        const synthesisPrompt = `Synthesize these profiles into a Master Profile for the Kenyan market. Data: ${JSON.stringify(pastProfiles)}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: synthesisPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(jsonrepair(completion.choices[0].message.content)));
    } catch (e) { res.status(500).send('Synthesis failed.'); }
});

app.listen(5000, () => console.log(`🚀 Server on http://localhost:5000`));
