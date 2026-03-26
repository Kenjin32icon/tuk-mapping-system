const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const mammoth = require('mammoth'); // For DOCX files
const Tesseract = require('tesseract.js'); // For OCR on images
const { jsonrepair } = require('jsonrepair'); // The magic JSON healer

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection and Schema
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },      
    userEmail: { type: String, required: true },   
    name: String,
    surveyAnswers: Object,
    generatedProfile: Object,
    createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

const upload = multer({ storage: multer.memoryStorage() });

// ─── Route: Upgraded Omni-Parser Pipeline (Multi-File BI) ───────────────────
app.post('/api/analyze-data', upload.array('documents', 5), async (req, res) => {
    console.log('--- New Multi-File BI Request Received ---');
    try {
        if (!req.files || req.files.length === 0 || !req.body.survey) {
            return res.status(400).send('Missing documents or survey data.');
        }

        const userId = req.body.userId;
        const userEmail = req.body.userEmail;

        if (!userId || !userEmail) {
            return res.status(401).send("Unauthorized: Missing user credentials.");
        }

        let surveyData = JSON.parse(req.body.survey);
        let combinedExtractedText = "";

        // 1. OMNI-PARSER PIPELINE: Loop through all uploaded files
        for (const file of req.files) {
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
            } catch (parseError) {
                console.warn(`Could not parse ${file.originalname}:`, parseError.message);
            }
        }

        const cleanedText = combinedExtractedText.replace(/\s+/g, ' ').trim().substring(0, 2000); 

        const combinedPrompt = `
        You are an intelligent BI career mapping AI. Analyze the student's extracted texts and survey.
        Strictly output ONLY valid JSON.
        
        Task: Return a JSON object containing 'bio', 'employability_score', 'technical_skills', 'soft_skills', and 'marketable_services'.
        
        Survey: ${JSON.stringify(surveyData)}
        Extracted Text: ${cleanedText}
        `;

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: combinedPrompt,
            stream: false,
            options: { temperature: 0.1, num_ctx: 2048, num_predict: 250 }
        });

        let rawResponse = response.data.response;
        let profileData;
        try {
            const repairedJson = jsonrepair(rawResponse);
            profileData = JSON.parse(repairedJson);
        } catch (repairError) {
            throw new Error("AI generated unreadable data.");
        }

        // 4. Save securely attached to this specific user
        const newProfile = new Profile({
            userId: userId,
            userEmail: userEmail,
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData
        });
        await newProfile.save();
        console.log(`💾 Profile saved securely for user: ${userEmail}`);

        // 5. Build Global Analytics & Trends (BI Component)
        const allProfiles = await Profile.find();
        const totalDocuments = allProfiles.length;
        const totalScore = allProfiles.reduce((acc, p) => acc + (p.generatedProfile?.employability_score || 0), 0);
        const avgScore = totalDocuments > 0 ? (totalScore / totalDocuments) : 0;
        
        const chartData = allProfiles.map(p => ({
            name: p.name ? p.name.split(' ')[0] : 'Unknown',
            score: p.generatedProfile?.employability_score || 0
        }));

        // 🛠️ THE FIX: Safely count skills globally across all profiles
        let skillCounts = {};
        allProfiles.forEach(p => {
            // Note: Ensuring we check both 'acquired_skills' and 'technical_skills' based on schema evolution
            let skills = p.generatedProfile?.acquired_skills || p.generatedProfile?.technical_skills;
            
            if (skills && Array.isArray(skills)) {
                skills.forEach(skill => {
                    let cleanSkill = skill.trim(); 
                    skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
                });
            }
        });

        const topSkills = Object.keys(skillCounts)
            .map(skill => ({ name: skill, count: skillCounts[skill] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 6. Return response to Frontend including global analytics
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

// ─── Route: Fetch User History & Documents ────────────────────────────
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

// ─── Route: Aggregate Analytics for BI Dashboard ────────────────────────────
app.get('/api/analytics', async (req, res) => {
    try {
        const profiles = await Profile.find();
        const totalScore = profiles.reduce((acc, p) => acc + (p.generatedProfile?.employability_score || 0), 0);
        const avgScore = profiles.length > 0 ? (totalScore / profiles.length).toFixed(2) : 0;

        const chartData = profiles.map(p => ({
            name: p.name ? p.name.split(' ')[0] : 'Unknown',
            score: p.generatedProfile?.employability_score || 0
        }));

        res.json({
            totalStudents: profiles.length,
            averageScore: avgScore,
            chartData: chartData
        });
    } catch (error) {
        res.status(500).send('Error fetching analytics');
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));