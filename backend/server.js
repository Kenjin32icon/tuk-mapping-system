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

        // 1. Extract and Clean Text (Reduced to 1500 for faster processing)
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

        console.log('🤖 Sending data to Llama 3.2 1B (Optimized for Speed)...');

        // 3. Send to Ollama with Speed Optimizations
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: combinedPrompt,
            stream: false,
            format: 'json',
            options: {
                temperature: 0.1,    // Extremely focused, less creative, much faster
                num_ctx: 1024,       // Limits context memory window
                num_predict: 250     // Caps the output length so it doesn't ramble
            }
        });

        const profileData = JSON.parse(response.data.response);
        console.log('✅ Llama BI generation complete.');

        // 4. Save & Send
        const newProfile = new Profile({
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData
        });
        await newProfile.save();
        console.log('💾 Profile saved to MongoDB.');

        res.json(profileData);

    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).send('An error occurred during analysis.');
    }
});

// ─── Route: BI Analytics Overview ───────────────────────────────────────────
app.get('/api/analytics-overview', async (req, res) => {
    console.log('--- Analytics Overview Request Received ---');
    try {
        const allProfiles = await Profile.find();

        if (allProfiles.length === 0) {
            return res.json({
                totalProfiles: 0,
                averageEmployabilityScore: 0,
                topTechnicalSkills: [],
                topSoftSkills: [],
                topServices: []
            });
        }

        // 1. Calculate average employability score
        const scores = allProfiles
            .map(p => p.generatedProfile?.employability_score)
            .filter(score => typeof score === 'number');
        const averageEmployabilityScore = scores.length > 0
            ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
            : 0;

        // 2. Tally most common technical skills
        const technicalSkillCount = {};
        allProfiles.forEach(p => {
            const skills = p.generatedProfile?.technical_skills || [];
            skills.forEach(skill => {
                const key = skill.toLowerCase().trim();
                technicalSkillCount[key] = (technicalSkillCount[key] || 0) + 1;
            });
        });
        const topTechnicalSkills = Object.entries(technicalSkillCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([skill, count]) => ({ skill, count }));

        // 3. Tally most common soft skills
        const softSkillCount = {};
        allProfiles.forEach(p => {
            const skills = p.generatedProfile?.soft_skills || [];
            skills.forEach(skill => {
                const key = skill.toLowerCase().trim();
                softSkillCount[key] = (softSkillCount[key] || 0) + 1;
            });
        });
        const topSoftSkills = Object.entries(softSkillCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([skill, count]) => ({ skill, count }));

        // 4. Tally most common marketable services
        const serviceCount = {};
        allProfiles.forEach(p => {
            const services = p.generatedProfile?.marketable_services || [];
            services.forEach(service => {
                const key = service.service_name?.toLowerCase().trim();
                if (key) serviceCount[key] = (serviceCount[key] || 0) + 1;
            });
        });
        const topServices = Object.entries(serviceCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([service, count]) => ({ service, count }));

        const analyticsData = {
            totalProfiles: allProfiles.length,
            averageEmployabilityScore,
            topTechnicalSkills,
            topSoftSkills,
            topServices
        };

        console.log(`📊 Analytics computed over ${allProfiles.length} profiles.`);
        res.json(analyticsData);

    } catch (error) {
        console.error('❌ Analytics Error:', error.message);
        res.status(500).send('An error occurred while computing analytics.');
    }
});

// ─── Route: Aggregate Analytics for BI Dashboard ────────────────────────────
app.get('/api/analytics', async (req, res) => {
    console.log('--- BI Dashboard Analytics Request Received ---');
    try {
        const profiles = await Profile.find();

        // BI Logic: Calculate Average Employability Score
        const totalScore = profiles.reduce((acc, p) => acc + (p.generatedProfile?.employability_score || 0), 0);
        const avgScore = profiles.length > 0 ? (totalScore / profiles.length).toFixed(2) : 0;

        // BI Logic: Map scores for a Bar Chart
        const chartData = profiles.map(p => ({
            name: p.name ? p.name.split(' ')[0] : 'Unknown', // First name only for the chart axis
            score: p.generatedProfile?.employability_score || 0
        }));

        console.log(`📊 BI Dashboard data computed for ${profiles.length} students.`);
        res.json({
            totalStudents: profiles.length,
            averageScore: avgScore,
            chartData: chartData
        });

    } catch (error) {
        console.error('❌ BI Analytics Error:', error.message);
        res.status(500).send('Error fetching analytics');
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));