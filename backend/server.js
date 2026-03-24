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

// ─── Route: The Main Analysis Engine (BI Optimized) ─────────────────────────
app.post('/api/analyze-data', upload.single('document'), async (req, res) => {
    console.log('--- New BI Request Received ---');
    try {
        if (!req.file || !req.body.survey) {
            return res.status(400).send('Missing document or survey data.');
        }

        let surveyData = JSON.parse(req.body.survey);
        console.log(`Processing data for: ${surveyData.name}`);

        // 1. Extract and Clean Text
        const pdfData = await pdfParse(req.file.buffer);
        const cleanedText = pdfData.text.replace(/\s+/g, ' ').trim().substring(0, 1500);

        // 2. The BI Prompt Engine
        const combinedPrompt = `
        You are an intelligent BI career mapping AI for university students. 
        Analyze the student's extracted CV text and survey answers.
        
        Task: Return a JSON object containing: 
        'bio': Professional summary (1 sentence).
        'employability_score': A number from 1 to 100 assessing their readiness for gig work.
        'technical_skills': Array of maximum 4 hard/software skills.
        'soft_skills': Array of maximum 3 interpersonal skills.
        'marketable_services': Array of exactly 2 gig-economy services. Each object must have 'service_name', 'description', and 'suggested_rate' (e.g., "$15/hr" or "Ksh 1500/hr").
        
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
            format: 'json',
            options: {
                temperature: 0.1,
                num_ctx: 1024,
                num_predict: 250
            }
        });

// --- NEW: Robust JSON Sanitizer ---
        let rawResponse = response.data.response;
        
        // 1. Strip markdown code blocks if Llama added them (e.g., ```json ... ```)
        rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // 2. Find the first '{' and the last '}' to extract only the JSON object
        const startIndex = rawResponse.indexOf('{');
        const endIndex = rawResponse.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("Llama did not return a valid JSON object.");
        }
        
        const cleanJsonString = rawResponse.substring(startIndex, endIndex + 1);
        
        // 3. Parse the cleaned string
        const profileData = JSON.parse(cleanJsonString);
        console.log('✅ Llama BI generation complete & parsed successfully.');

        // 4. Save the new profile
        const newProfile = new Profile({
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData
        });

        await newProfile.save();
        console.log('💾 Profile saved to MongoDB.');

        // 5. NEW: Fetch GLOBAL analytics to update the dashboard immediately
        const allProfiles = await Profile.find();
        const totalStudents = allProfiles.length;
        const avgScore = allProfiles.reduce((acc, p) => 
            acc + (p.generatedProfile?.employability_score || 0), 0) / (totalStudents || 1);

        const chartData = allProfiles.map(p => ({
            name: p.name ? p.name.split(' ')[0] : 'Unknown', 
            score: p.generatedProfile?.employability_score || 0
        }));

        // --- NEW: Calculate Skill Frequencies for the Heatmap ---
        const skillCounts = {};
        allProfiles.forEach(p => {
            const skills = p.generatedProfile?.technical_skills || [];
            skills.forEach(skill => {
                // Standardize the text (e.g., "Python" and "python" become "Python")
                const cleanSkill = skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1).toLowerCase();
                skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
            });
        });
        
        // Convert to array, sort by popularity, and grab the top 5
        const topSkills = Object.keys(skillCounts)
            .map(skill => ({ name: skill, count: skillCounts[skill] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 6. Send everything back to the frontend
        res.json({
            ...profileData, 
            analyticsData: {
                totalStudents,
                averageScore: avgScore.toFixed(1),
                chartData,
                topSkills // Send the new heatmap data
            }
        });

    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).send('An error occurred during analysis.');
    }
});

// ─── Route: BI Analytics Overview ───────────────────────────────────────────
app.get('/api/analytics-overview', async (req, res) => {
    try {
        const allProfiles = await Profile.find();
        if (allProfiles.length === 0) {
            return res.json({ totalProfiles: 0, averageEmployabilityScore: 0, topTechnicalSkills: [] });
        }

        const scores = allProfiles
            .map(p => p.generatedProfile?.employability_score)
            .filter(score => typeof score === 'number');
        
        const averageEmployabilityScore = scores.length > 0
            ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
            : 0;

        res.json({
            totalProfiles: allProfiles.length,
            averageEmployabilityScore,
            // (Remaining logic for top skills/services can stay here or use the logic from the POST route)
        });
    } catch (error) {
        res.status(500).send('Error computing analytics');
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