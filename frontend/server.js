const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer for file uploads (storing in memory for fast processing)
const upload = multer({ storage: multer.memoryStorage() });

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

app.listen(5000, () => console.log('Backend running on port 5000'));
