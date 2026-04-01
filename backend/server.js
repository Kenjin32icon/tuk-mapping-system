// ============================================================================
// 1. IMPORTS & SYSTEM CONFIGURATION
// ============================================================================
const express = require('express');
const multer = require('multer');          // Handles file uploads
const fs = require('fs');                  // Added: File system for local storage
const path = require('path');              // Added: Path utilities
const pdfParse = require('pdf-parse');     // Extracts text from PDFs
const axios = require('axios');            // Makes HTTP requests to Ollama
const cors = require('cors');              // Allows frontend to talk to backend
const mongoose = require('mongoose');      // Connects to MongoDB
const mammoth = require('mammoth');        // Extracts text from DOCX files
const Tesseract = require('tesseract.js'); // Performs OCR on images
const { jsonrepair } = require('jsonrepair'); // Fixes AI JSON formatting

const app = express();
app.use(cors());
app.use(express.json()); 

// --- NEW: Local Storage Configuration ---

// 1. Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Configure Multer to save to the 'uploads' folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save files here
    },
    filename: function (req, file, cb) {
        // Create a unique filename to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 3. Tell Express to serve the 'uploads' folder publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// 2. DATABASE CONNECTION & SCHEMA DEFINITION
// ============================================================================
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },      
    userEmail: { type: String, required: true },   
    name: String,
    surveyAnswers: Object,
    generatedProfile: Object,
    savedDocuments: [{ 
        fileName: String, 
        fileUrl: String 
    }], 
    createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

// ============================================================================
// 3. MAIN AI PIPELINE: PARSE, ANALYZE, AND SAVE
// ============================================================================
app.post('/api/analyze-data', upload.array('documents', 5), async (req, res) => {
    console.log('--- New Multi-File BI Request Received ---');
    try {
        if (!req.files || req.files.length === 0 || !req.body.survey) {
            return res.status(400).send('Missing documents or survey data.');
        }

        const userId = req.body.userId;
        const userEmail = req.body.userEmail;
        if (!userId || !userEmail) throw new Error("Unauthorized: Missing user credentials.");

        let surveyData = JSON.parse(req.body.survey);
        
        // --- STEP A: THE OMNI-PARSER ---
        let combinedExtractedText = "";

        for (const file of req.files) {
            const mimeType = file.mimetype;
            // Note: Since we use diskStorage, we now read from file.path instead of file.buffer
            const fileBuffer = fs.readFileSync(file.path); 
            
            try {
                if (mimeType === 'application/pdf') {
                    const pdfData = await pdfParse(fileBuffer);
                    combinedExtractedText += pdfData.text + " ";
                } 
                else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
                    combinedExtractedText += docxData.value + " ";
                } 
                else if (mimeType.startsWith('image/')) {
                    const ocrData = await Tesseract.recognize(fileBuffer, 'eng');
                    combinedExtractedText += ocrData.data.text + " ";
                }
            } catch (error) {
                console.warn(`Could not parse ${file.originalname}, skipping.`);
            }
        }

        const cleanedText = combinedExtractedText.replace(/\s+/g, ' ').trim().substring(0, 2000); 

        const combinedPrompt = `
        You are an intelligent BI career mapping AI. Analyze the student's extracted texts and survey.
        Strictly output ONLY valid JSON.
        
        Task: Return a JSON object containing: 
        'bio': Professional summary (1 sentence).
        'employability_score': A number from 1 to 100.
        'acquired_skills': Array of maximum 4 hard/software skills as Strings.
        'soft_skills': Array of maximum 3 interpersonal skills as Strings.
        'marketable_services': Array of exactly 2 gig-economy services (requires 'service_name', 'description').
        
        Survey: ${JSON.stringify(surveyData)}
        Extracted Text: ${cleanedText}
        `;

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: combinedPrompt,
            stream: false,
            options: { temperature: 0.7, top_p: 0.9, num_ctx: 2048, num_predict: 500 }
        });

        let profileData;
        try {
            const repairedJson = jsonrepair(response.data.response);
            profileData = JSON.parse(repairedJson);
        } catch (repairError) {
            throw new Error("Critical JSON failure. Llama output was unfixable.");
        }

        // --- NEW: Map the locally saved files into the array structure ---
        const uploadedDocsInfo = req.files.map(file => ({
            fileName: file.originalname,
            // Create a local URL pointing to the file on your Node server
            fileUrl: `http://localhost:5000/uploads/${file.filename}` 
        }));

        // --- SECURE DATABASE SAVE ---
        const newProfile = new Profile({
            userId: userId,
            userEmail: userEmail,
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData,
            savedDocuments: uploadedDocsInfo // Saves the local file URL!
        });
        await newProfile.save();

        // Calculate immediate response analytics
        const userProfiles = await Profile.find({ userId: userId });
        const totalDocuments = userProfiles.length;
        const totalScore = userProfiles.reduce((acc, p) => acc + (p.generatedProfile?.employability_score || 0), 0);
        const avgScore = totalDocuments > 0 ? (totalScore / totalDocuments) : 0;

        const chartData = userProfiles.map((p, index) => ({
            name: `Doc ${index + 1}`,
            score: p.generatedProfile?.employability_score || 0
        }));

        const skillCounts = {};
        userProfiles.forEach(p => {
            const skills = p.generatedProfile?.acquired_skills;
            if (skills && Array.isArray(skills)) {
                skills.forEach(skill => {
                    if (typeof skill === 'string' && skill.trim() !== '') {
                        const cleanSkill = skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1).toLowerCase();
                        skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
                    }
                });
            }
        });
        
        const topSkills = Object.keys(skillCounts)
            .map(skill => ({ name: skill, count: skillCounts[skill] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            ...profileData, 
            analyticsData: {
                totalStudents: totalDocuments, 
                averageScore: avgScore.toFixed(1),
                chartData,
                topSkills 
            }
        });

    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).send('An error occurred during analysis.');
    }
});

// ─── Route: Synthesize Master Profile from All Documents ───────────────────
app.post('/api/synthesize-profile', async (req, res) => {
    try {
        const { userId } = req.body;
        const userHistory = await Profile.find({ userId: userId });
        if (userHistory.length === 0) return res.status(400).send("No documents found.");

        const pastProfiles = userHistory.map(doc => doc.generatedProfile);

        const synthesisPrompt = `
        Synthesize these separate document analyses into ONE comprehensive master profile.
        Strictly output ONLY valid JSON.
        Data: ${JSON.stringify(pastProfiles)}
        `;

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: synthesisPrompt,
            stream: false
        });

        const repairedJson = jsonrepair(response.data.response);
        const masterProfile = JSON.parse(repairedJson);
        res.json(masterProfile);

    } catch (error) {
        console.error('❌ Synthesis Error:', error.message);
        res.status(500).send('Error synthesizing profile.');
    }
});

// ─── Route: Fetch User Historical Data ──────────────────────────────────────
app.get('/api/user-history/:userId', async (req, res) => {
    try {
        const userHistory = await Profile.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ count: userHistory.length, history: userHistory });
    } catch (error) {
        res.status(500).send('An error occurred while fetching history.');
    }
});

// ============================================================================
// 5. START THE SERVER
// ============================================================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend safely running on http://localhost:${PORT}`);
});