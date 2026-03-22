const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection with success/error logging
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

// ─── Route: The Main Analysis Engine ───────────────────────────────────────
app.post('/api/analyze-data', upload.single('document'), async (req, res) => {
    console.log('--- New Request Received ---');
    try {
        // Validation: Ensure both file and survey data exist
        if (!req.file) {
            console.log('❌ Error: No PDF document provided.');
            return res.status(400).send('No document uploaded.');
        }
        if (!req.body.survey) {
            console.log('❌ Error: No survey data provided.');
            return res.status(400).send('No survey data provided.');
        }

        // Parse Survey Data safely
        let surveyData;
        try {
            surveyData = JSON.parse(req.body.survey);
        } catch (e) {
            console.log('❌ Error: Invalid JSON in survey field.');
            return res.status(400).send('Invalid JSON format in survey field.');
        }

        console.log(`Processing data for: ${surveyData.name || 'Unknown Student'}`);

        // 1. Extract and Clean Text
        const pdfData = await pdfParse(req.file.buffer);
        const cleanedText = pdfData.text.replace(/\s+/g, ' ').trim().substring(0, 2000); 
        // Note: we trim to 2000 chars to ensure the 1B model doesn't get overwhelmed

        // 2. The Prompt Engine
        const combinedPrompt = `
        You are an intelligent career mapping AI for university students. 
        Analyze the student's extracted CV/transcript text and their survey answers.
        
        Task: Return a JSON object containing: 
        'bio': A professional summary (2 sentences). 
        'acquired_skills': A list of technical and soft skills found. 
        'marketable_services': A list of objects with 'service_name' and 'description'.
        
        Student Survey: ${JSON.stringify(surveyData)}
        Extracted Text: ${cleanedText}
        
        Strictly output ONLY valid JSON.
        `;

        console.log('🤖 Sending data to Llama 3.2 1B...');

        // 3. Send to Ollama
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: combinedPrompt,
            stream: false,
            format: 'json'
        });

        // Parse LLM response
        const profileData = JSON.parse(response.data.response);
        console.log('✅ Llama generation complete.');

        // 4. Save to MongoDB
        const newProfile = new Profile({
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData
        });
        await newProfile.save();
        console.log('💾 Profile saved to MongoDB.');

        // 5. Send result back to Frontend/Thunder Client
        res.json(profileData);

    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).send('An error occurred during analysis.');
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));