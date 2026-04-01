// ============================================================================
// 1. IMPORTS & SYSTEM CONFIGURATION
// ============================================================================
const express = require('express');
const multer = require('multer');          
const fs = require('fs');                  
const path = require('path');              
const pdfParse = require('pdf-parse');     
const axios = require('axios');            
const cors = require('cors');              
const mongoose = require('mongoose');      
const mammoth = require('mammoth');        
const { jsonrepair } = require('jsonrepair'); 

const app = express();
app.use(cors());
app.use(express.json()); 

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) { 
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// UPGRADE: Changed from upload.single to upload.array (max 5 files)
const upload = multer({ storage: storage });

// ============================================================================
// 2. DATABASE CONNECTION & UPGRADED SCHEMA
// ============================================================================
mongoose.connect('mongodb://localhost:27017/tuk-mapping')
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// UPGRADE: Added fields for Google Metadata and multiple document tracking
const ProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },      
    userEmail: { type: String, required: true },
    userName: { type: String },                    
    userPicture: { type: String },                 
    documentsAnalyzed: [{ type: String }],         // Array of original filenames
    generatedProfile: { type: Object, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', ProfileSchema);

// ============================================================================
// 3. MAIN ROUTE: MULTI-DOCUMENT ANALYSIS & METADATA CAPTURE
// ============================================================================
app.post('/api/analyze-data', upload.array('documents', 5), async (req, res) => {
    console.log('--- Received Multi-Document Analysis Request ---');
    
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No documents uploaded.');
    }

    try {
        // 1. Parse Metadata (User Info) sent from the frontend
        // Note: Ensure your frontend appends 'metadata' as a stringified JSON in the FormData
        const metadata = JSON.parse(req.body.metadata || '{}');
        const userId = metadata.uid || 'anonymous';
        const userEmail = metadata.email || 'unknown@example.com';
        const userName = metadata.displayName || 'TU-K Student';
        const userPicture = metadata.photoURL || '';

        // 2. Concatenation Logic: Loop through all uploaded files
        let combinedText = "";
        const processedFileNames = [];

        for (const file of req.files) {
            processedFileNames.push(file.originalname);
            const filePath = file.path;
            let extractedText = "";

            if (file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                extractedText = pdfData.text;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const docxData = await mammoth.extractRawText({ path: filePath });
                extractedText = docxData.value;
            } else {
                console.warn(`Unsupported file type skipped: ${file.originalname}`);
                // Clean up unsupported file
                fs.unlinkSync(filePath);
                continue;
            }

            // Append with a clear delimiter for the AI
            combinedText += `\n\n--- START OF DOCUMENT: ${file.originalname} ---\n`;
            combinedText += extractedText;
            combinedText += `\n--- END OF DOCUMENT: ${file.originalname} ---\n`;

            // Optional: Remove file after text extraction to save space
            fs.unlinkSync(filePath);
        }

        console.log(`Successfully extracted text from ${processedFileNames.length} documents.`);

        // 3. AI Prompt Construction
        const aiPrompt = `
        You are an expert career advisor mapping university coursework to the job market.
        Analyze the following combined text from multiple student documents. 
        
        Extract the academic focus, technical skills, and soft skills. Then, suggest 2-3 marketable freelance or professional services the student can offer.
        
        Combined Document Text:
        """${combinedText.substring(0, 12000)}""" 
        
        Strictly return the result as a JSON object matching this structure:
        {
          "bio": "A brief summary of their academic focus based on the documents",
          "acquired_skills": ["Skill 1", "Skill 2", "Skill 3"],
          "soft_skills": ["Skill A", "Skill B"],
          "marketable_services": [
            { "service_name": "Name", "description": "How they provide value" }
          ],
          "employability_score": 85
        }
        OUTPUT ONLY VALID JSON.
        `;

        // 4. Call Llama 3.2 via Ollama
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:1b',
            prompt: aiPrompt,
            stream: false,
            options: { 
                temperature: 0.3, 
                num_ctx: 4096 // Increased context for multiple docs
            }
        });

        // 5. Auto-Heal JSON & Save to Database
        const repairedJson = jsonrepair(response.data.response);
        const generatedProfile = JSON.parse(repairedJson);

        const newProfile = new Profile({
            userId,
            userEmail,
            userName,
            userPicture,
            documentsAnalyzed: processedFileNames,
            generatedProfile
        });

        await newProfile.save();
        console.log('✅ Multi-document profile saved to database.');

        res.json(generatedProfile);

    } catch (error) {
        console.error('❌ Analysis Error:', error.message);
        res.status(500).send('Error analyzing documents.');
    }
});

// ─── Route: Fetch User Historical Data ──────────────────────────────────────
app.get('/api/user-history/:userId', async (req, res) => {
    try {
        const userHistory = await Profile.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ 
            count: userHistory.length, 
            history: userHistory 
        });
    } catch (error) {
        console.error('❌ History Fetch Error:', error.message);
        res.status(500).send('An error occurred while fetching history.');
    }
});

// ─── Route: Synthesis (Master Profile) ─────────────────────────────────────
app.post('/api/synthesize-profile', async (req, res) => {
    const { userId } = req.body;
    try {
        const history = await Profile.find({ userId }).sort({ createdAt: -1 });
        if (history.length < 2) return res.status(400).send("Need at least 2 documents.");

        const pastProfiles = history.map(doc => doc.generatedProfile);

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

// ============================================================================
// 5. START THE SERVER
// ============================================================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Upgraded Backend running on http://localhost:${PORT}`);
});