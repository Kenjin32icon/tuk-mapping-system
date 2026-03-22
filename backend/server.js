const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// Clean connection for modern Mongoose
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch(err => console.error('Connection error:', err));

// Define a simple Schema to save the results
const ProfileSchema = new mongoose.Schema({
    name: String,
    surveyAnswers: Object,
    generatedProfile: Object
});
const Profile = mongoose.model('Profile', ProfileSchema);

// Set up Multer for file uploads (storing in memory for fast processing)
const upload = multer({ storage: multer.memoryStorage() });

// ─── Route 1: Original document-only analysis ────────────────────────────────
app.post('/api/analyze-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No document uploaded.');

        // 1. Extract text from the uploaded PDF
        const pdfData = await pdfParse(req.file.buffer);
        const documentText = pdfData.text;

        // 2. The Prompt Engine (Instructing Llama 3.2 1B)
        const prompt = `
        You are an intelligent mapping system for the Technical University of Kenya.
        Analyze the following academic document and extract the student's profile.
        
        DOCUMENT TEXT:
        "${documentText}"

        TASK:
        Identify the person, extract their core technical and soft skills, and map those skills to 3-5 specific, marketable gig-economy services they could offer.
        
        RESPOND STRICTLY IN THE FOLLOWING JSON FORMAT AND NOTHING ELSE:
        {
            "name": "Student Name (or 'Unknown' if not found)",
            "bio": "A brief 1-sentence summary of their academic focus",
            "skills": ["Skill 1", "Skill 2", "Skill 3"],
            "services": [
                { "serviceName": "Service Name", "description": "Short description of what they can do" }
            ]
        }
        `;

        // 3. Send to local Llama 3.2 1B via Ollama API
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: prompt,
            stream: false,
            format: 'json' // Forces the model to output valid JSON
        });

        // 4. Send the generated JSON profile back to the React frontend
        const profileData = JSON.parse(response.data.response);
        res.json(profileData);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error analyzing document');
    }
});

// ─── Route 2: Combined document + survey analysis with MongoDB persistence ────
app.post('/api/analyze-data', upload.single('document'), async (req, res) => {
    try {
        // 1. Get the uploaded file and the survey answers from the request
        const surveyData = JSON.parse(req.body.survey); // Sent from React
        const pdfData = await pdfParse(req.file.buffer);

        // Clean the extracted text to save token space
        const cleanedText = pdfData.text.replace(/\s+/g, ' ').trim();

        // 2. Combine Data for the Prompt
        const combinedPrompt = `
        You are an intelligent career mapping AI for university students. I will provide you with a student's extracted CV text, transcript data, and survey answers. 
        Task: Analyze this data and return a JSON object containing: 
        'bio': A 2-sentence professional summary. 
        'acquired_skills': An array of strings. 
        'marketable_services': An array of objects with 'service_name' and 'description' representing freelance gigs they can offer based on their skills. 
        Strictly output ONLY valid JSON. Do not include markdown tags or introductory text. 
        
        Student Survey Data: ${JSON.stringify(surveyData)}
        Extracted Document Text: ${cleanedText}
        `;

        // 3. Send to local Llama 3.2 1B via Ollama API
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: combinedPrompt,
            stream: false,
            format: 'json'
        });

        const profileData = JSON.parse(response.data.response);

        // 4. Save to MongoDB
        const newProfile = new Profile({
            name: surveyData.name,
            surveyAnswers: surveyData,
            generatedProfile: profileData
        });
        await newProfile.save();

        res.json(profileData);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error analyzing data');
    }
});

app.listen(5000, () => console.log('Backend running on port 5000'));
