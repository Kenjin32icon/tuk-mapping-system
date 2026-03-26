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
// Connect to MongoDB (Make sure your local MongoDB instance is running!)
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// The Blueprint for how a Student Profile is securely saved
const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },      // Google User ID (Security)
    userEmail: { type: String, required: true },   // Google Email (Security)
    name: String,                                  // Student's Name
    surveyAnswers: Object,                         // Their major, goals, etc.
    generatedProfile: Object,                      // The AI generated JSON profile
    createdAt: { type: Date, default: Date.now }   // Timestamp
});
const Profile = mongoose.model('Profile', ProfileSchema);

// Configure Multer to store uploaded files in RAM instead of the hard drive for speed
const upload = multer({ storage: multer.memoryStorage() });


// ============================================================================
// 3. MAIN AI PIPELINE: PARSE, ANALYZE, AND SAVE
// ============================================================================
// This route accepts up to 5 documents at once using the "documents" key
app.post('/api/analyze-data', upload.array('documents', 5), async (req, res) => {
    console.log('--- New Multi-File BI Request Received ---');
    try {
        // Validation: Ensure files, survey, and Google Auth credentials exist
        if (!req.files || req.files.length === 0 || !req.body.survey) {
            return res.status(400).send('Missing documents or survey data.');
        }

        const userId = req.body.userId;
        const userEmail = req.body.userEmail;
        if (!userId || !userEmail) throw new Error("Unauthorized: Missing user credentials.");

        let surveyData = JSON.parse(req.body.survey);
        console.log(`Processing ${req.files.length} files for: ${userEmail}`);

        // --- STEP A: THE OMNI-PARSER ---
        let combinedExtractedText = "";
        
        // Loop through every file the user uploaded
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
            } catch (error) {
                console.warn(`Could not parse ${file.originalname}, skipping.`);
            }
        }

        // --- STEP B: CONTEXT MANAGEMENT ---
        // Clean up weird spaces and heavily truncate the text so Llama's memory doesn't overflow
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

        // --- STEP C: SEND TO LOCAL AI (OLLAMA) ---
        console.log('🤖 Sending data to Llama 3.2...');
        const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'llama3.2:1b',
    prompt: combinedPrompt,
    stream: false,
    options: { 
        temperature: 0.7,   // ⬆️ FIX: Raised from 0.1 to 0.7 for higher creativity
        top_p: 0.9,         // ✨ PRO-TIP: Adds 'nucleus sampling' to increase vocabulary diversity
        num_ctx: 2048, 
        num_predict: 500    // ⬆️ Raised from 250 so the AI has enough room to write longer, creative responses
    }
});

        // --- STEP D: AUTO-HEAL THE JSON ---
        let rawResponse = response.data.response;
        let profileData;
        
        try {
            // jsonrepair automatically adds missing commas, quotes, or brackets hallucinated by Llama
            const repairedJson = jsonrepair(rawResponse);
            profileData = JSON.parse(repairedJson);
        } catch (repairError) {
            throw new Error("Critical JSON failure. Llama output was unfixable.");
        }

        // --- STEP E: SECURE DATABASE SAVE ---
        const newProfile = new Profile({
            userId: userId,
            userEmail: userEmail,
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData
        });
        await newProfile.save();
        console.log(`💾 Profile saved securely for user: ${userEmail}`);

        // --- STEP F: GENERATE PERSONAL ANALYTICS ---
        // Fetch only documents belonging to this specific Google user
        const userProfiles = await Profile.find({ userId: userId });
        const totalDocuments = userProfiles.length;
        
        // Calculate the average employability score across all their past uploads
        const totalScore = userProfiles.reduce((acc, p) => acc + (p.generatedProfile?.employability_score || 0), 0);
        const avgScore = totalDocuments > 0 ? (totalScore / totalDocuments) : 0;

        // Map data for the frontend Progress Chart
        const chartData = userProfiles.map((p, index) => ({
            name: `Doc ${index + 1}`,
            score: p.generatedProfile?.employability_score || 0
        }));

        // 🛠️ THE ERROR FIX: Safe Heatmap Calculation
        const skillCounts = {};
        userProfiles.forEach(p => {
            const skills = p.generatedProfile?.acquired_skills;
            
            // Check 1: Does the array exist?
            if (skills && Array.isArray(skills)) {
                skills.forEach(skill => {
                    // Check 2: Is the skill actually a String? (Prevents the crash!)
                    if (typeof skill === 'string' && skill.trim() !== '') {
                        const cleanSkill = skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1).toLowerCase();
                        skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
                    }
                });
            }
        });
        
        // Sort the most frequently occurring skills
        const topSkills = Object.keys(skillCounts)
            .map(skill => ({ name: skill, count: skillCounts[skill] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // --- STEP G: RETURN TO FRONTEND ---
        res.json({
            ...profileData, 
            analyticsData: {
                totalStudents: totalDocuments, // Note: Frontend displays this as "Documents Analyzed"
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


// ============================================================================
// 4. ROUTE: FETCH USER HISTORICAL DATA (FOR THE "MY DOCUMENTS" TAB)
// ============================================================================
app.get('/api/user-history/:userId', async (req, res) => {
    console.log(`--- Fetching history for user: ${req.params.userId} ---`);
    try {
        // Find all profiles for this user, sorted by newest first (-1)
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


// ============================================================================
// 5. START THE SERVER
// ============================================================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend safely running on http://localhost:${PORT}`);
});