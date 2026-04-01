// ============================================================================
// 1. IMPORTS & SYSTEM CONFIGURATION
// ============================================================================
const express = require('express');
const multer = require('multer');          // Handles file uploads from React
const pdfParse = require('pdf-parse');     // Extracts text from PDFs
const axios = require('axios');            // Makes HTTP requests to Ollama
const cors = require('cors');              // Allows frontend to talk to backend
const mongoose = require('mongoose');      // Connects to MongoDB
const mammoth = require('mammoth');        // Extracts text from DOCX (Word) files
const Tesseract = require('tesseract.js'); // Performs OCR on images to read text
const { jsonrepair } = require('jsonrepair'); // Magically fixes broken AI JSON formatting

const app = express();
app.use(cors());
app.use(express.json()); // Allows server to read JSON bodies

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
    // NEW: Saves the names of the files they uploaded!
    analyzedDocuments: [String], 
    // Keeps track of detailed document metadata
    documents: [{ 
        documentName: String, 
        documentUrl: String 
    }],
    createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

const upload = multer({ storage: multer.memoryStorage() });


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
        let fileMetadata = [];

        for (const file of req.files) {
            fileMetadata.push({
                documentName: file.originalname,
                documentUrl: "memory_storage"
            });

            const mimeType = file.mimetype;
            try {
                if (mimeType === 'application/pdf') {
                    const pdfData = await pdfParse(file.buffer);
                    combinedExtractedText += pdfData.text + " ";
                } 
                else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const docxData = await mammoth.extractRawText({ buffer: file.buffer });
                    combinedExtractedText += docxData.value + " ";
                } 
                else if (mimeType.startsWith('image/')) {
                    const ocrData = await Tesseract.recognize(file.buffer, 'eng');
                    combinedExtractedText += ocrData.data.text + " ";
                }
            } catch (error) {
                console.warn(`Could not parse ${file.originalname}, skipping.`);
            }
        }

        const cleanedText = combinedExtractedText.replace(/\s+/g, ' ').trim().substring(0, 2000); 

        const combinedPrompt = `
        You are an intelligent BI career mapping AI. Analyze the student's extracted texts and survey.
        Strictly output ONLY valid JSON. Do not include markdown.
        
        Task: Return a JSON object containing: 
        'bio': Professional summary (1 sentence).
        'employability_score': A number from 1 to 100.
        'acquired_skills': Array of maximum 4 hard/software skills as Strings.
        'soft_skills': Array of maximum 3 interpersonal skills as Strings.
        'marketable_services': Array of exactly 2 gig-economy services (requires 'service_name', 'description').
        
        Survey: ${JSON.stringify(surveyData)}
        Extracted Text: ${cleanedText}
        `;

        console.log('🤖 Sending data to Llama 3.2...');
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: combinedPrompt,
            stream: false,
            options: { 
                temperature: 0.7,   
                top_p: 0.9,         
                num_ctx: 2048, 
                num_predict: 500    
            }
        });

        let rawResponse = response.data.response;
        let profileData;
        try {
            const repairedJson = jsonrepair(rawResponse);
            profileData = JSON.parse(repairedJson);
        } catch (repairError) {
            throw new Error("Critical JSON failure. Llama output was unfixable.");
        }

        // NEW: Extract the original names of the files uploaded
        const uploadedFileNames = req.files.map(file => file.originalname);

        // UPDATED: Saving the profile with document names
        const newProfile = new Profile({
            userId: userId,
            userEmail: userEmail,
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData,
            analyzedDocuments: uploadedFileNames, // Save file names
            documents: fileMetadata
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
        const { userId, userEmail } = req.body;
        if (!userId) return res.status(400).send("User ID required");

        console.log(`--- Synthesizing Master Profile for: ${userEmail} ---`);

        const userHistory = await Profile.find({ userId: userId });
        if (userHistory.length === 0) {
            return res.status(400).send("No documents found to analyze.");
        }

        const pastProfiles = userHistory.map(doc => doc.generatedProfile);

        const synthesisPrompt = `
        You are an expert Career Mapping AI. Review the following separate document analyses for a single student.
        Synthesize them into ONE comprehensive master profile.
        Strictly output ONLY valid JSON.
        
        Task: Return a JSON object containing:
        'professional_title': A 2-4 word job title (e.g., 'Data Analyst & Researcher').
        'bio': A strong 2-sentence professional summary combining all their experiences.
        'skills': An object with two arrays: 'technical' (max 6) and 'soft' (max 4).
        'services': Array of exactly 3 marketable services they can offer based on their combined skills. 
                    Each service must have 'service_name', 'description', and a 'match_percentage' (a number from 1 to 100).

        Past Analyses Data: ${JSON.stringify(pastProfiles)}
        `;

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: synthesisPrompt,
            stream: false,
            options: { temperature: 0.6, num_ctx: 2048, num_predict: 500 }
        });

        const repairedJson = jsonrepair(response.data.response);
        const masterProfile = JSON.parse(repairedJson);

        res.json(masterProfile);

    } catch (error) {
        console.error('❌ Synthesis Error:', error.message);
        res.status(500).send('Error synthesizing profile.');
    }
});


// ============================================================================
// 4. ROUTE: FETCH USER HISTORICAL DATA (FOR THE "MY DOCUMENTS" TAB)
// ============================================================================
app.get('/api/user-history/:userId', async (req, res) => {
    console.log(`--- Fetching history for user: ${req.params.userId} ---`);
    try {
        const userHistory = await Profile.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({
            count: userHistory.length,
            history: userHistory
        });
    } catch (error) {
        console.error('❌ Error fetching user history:', error.message);
        res.status(500).send('An error occurred while fetching history.');
    }
});


// ─── Route: Fetch Personal Analytics for Persistent Dashboard ─────────────────
// Added to allow frontend to fetch historical data upon login
app.get('/api/analytics/:userId', async (req, res) => {
    try {
        const userProfiles = await Profile.find({ userId: req.params.userId });
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
            totalStudents: totalDocuments, 
            averageScore: avgScore.toFixed(1),
            chartData,
            topSkills 
        });
    } catch (error) {
        res.status(500).send('Error fetching personal analytics');
    }
});


// ============================================================================
// 5. START THE SERVER
// ============================================================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend safely running on http://localhost:${PORT}`);
});