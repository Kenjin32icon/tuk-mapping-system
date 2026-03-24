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

// 1. Database Connection
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const ProfileSchema = new mongoose.Schema({
    name: String,
    surveyAnswers: Object,
    generatedProfile: Object,
    createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

const upload = multer({ storage: multer.memoryStorage() });

// ─── Route: Upgraded Omni-Parser Pipeline (Multi-File BI) ───────────────────
// Updated to handle up to 5 files simultaneously
app.post('/api/analyze-data', upload.array('documents', 5), async (req, res) => {
    console.log('--- New Multi-File BI Request Received ---');
    try {
        if (!req.files || req.files.length === 0 || !req.body.survey) {
            return res.status(400).send('Missing documents or survey data.');
        }

        let surveyData = JSON.parse(req.body.survey);
        console.log(`Processing ${req.files.length} files for: ${surveyData.name}`);

        let combinedExtractedText = "";

        // 1. OMNI-PARSER PIPELINE: Loop through all uploaded files
        for (const file of req.files) {
            const mimeType = file.mimetype;
            console.log(`Parsing file: ${file.originalname} (${mimeType})`);

            try {
                if (mimeType === 'application/pdf') {
                    const pdfData = await pdfParse(file.buffer);
                    combinedExtractedText += pdfData.text + " ";
                } 
                else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    // Extract text from DOCX using mammoth
                    const docxData = await mammoth.extractRawText({ buffer: file.buffer });
                    combinedExtractedText += docxData.value + " ";
                } 
                else if (mimeType.startsWith('image/')) {
                    // Extract text from PNG/JPEG using OCR via Tesseract
                    const ocrData = await Tesseract.recognize(file.buffer, 'eng');
                    combinedExtractedText += ocrData.data.text + " ";
                }
            } catch (parseError) {
                console.warn(`Could not parse ${file.originalname}:`, parseError.message);
            }
        }

        // 2. CONTEXT MANAGEMENT: Clean and truncate to handle multi-file context
        const cleanedText = combinedExtractedText.replace(/\s+/g, ' ').trim().substring(0, 2000); 

        const combinedPrompt = `
        You are an intelligent BI career mapping AI. Analyze the student's extracted texts and survey.
        Strictly output ONLY valid JSON. Do not include markdown.
        
        Task: Return a JSON object containing: 
        'bio': Professional summary (1 sentence).
        'employability_score': A number from 1 to 100.
        'technical_skills': Array of maximum 4 hard/software skills.
        'soft_skills': Array of maximum 3 interpersonal skills.
        'marketable_services': Array of exactly 2 gig-economy services (requires 'service_name', 'description', 'suggested_rate').
        
        Survey: ${JSON.stringify(surveyData)}
        Extracted Text: ${cleanedText}
        `;

        console.log('🤖 Sending aggregated data to Llama...');

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: combinedPrompt,
            stream: false,
            options: {
                temperature: 0.1,    
                num_ctx: 2048,   // Increased context window for multiple files
                num_predict: 250     
            }
        });

        // 3. THE JSON AUTO-HEALER
        let rawResponse = response.data.response;
        let profileData;
        
        try {
            // Fixes missing commas/brackets automatically before parsing
            const repairedJson = jsonrepair(rawResponse);
            profileData = JSON.parse(repairedJson);
            console.log('✅ Llama output parsed and auto-healed successfully.');
        } catch (repairError) {
            console.error("Critical JSON failure. Llama output was unfixable:", rawResponse);
            throw new Error("AI generated unreadable data.");
        }

        // 4. Save the new profile to Database
        const newProfile = new Profile({
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData
        });
        await newProfile.save();

        // 5. GLOBAL Analytics Aggregation logic
        const allProfiles = await Profile.find();
        const totalStudents = allProfiles.length;
        const avgScore = allProfiles.reduce((acc, p) => 
            acc + (p.generatedProfile?.employability_score || 0), 0) / (totalStudents || 1);

        const chartData = allProfiles.map(p => ({
            name: p.name ? p.name.split(' ')[0] : 'Unknown', 
            score: p.generatedProfile?.employability_score || 0
        }));

        const skillCounts = {};
        allProfiles.forEach(p => {
            const skills = p.generatedProfile?.technical_skills || [];
            skills.forEach(skill => {
                const cleanSkill = skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1).toLowerCase();
                skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
            });
        });
        
        const topSkills = Object.keys(skillCounts)
            .map(skill => ({ name: skill, count: skillCounts[skill] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 6. Return response to Frontend
        res.json({
            ...profileData, 
            analyticsData: {
                totalStudents,
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