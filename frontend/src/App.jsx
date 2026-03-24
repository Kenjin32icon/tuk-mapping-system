import React, { useState } from 'react';
import axios from 'axios';

function App() {
  // 1. State for the File and AI Output
  const [file, setFile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. State for the User Survey
  const [surveyData, setSurveyData] = useState({
    name: '',
    major: '',
    career_goal: ''
  });

  // Handle text input changes
  const handleInputChange = (e) => {
    setSurveyData({
      ...surveyData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a document first.");
      return;
    }
    if (!surveyData.name || !surveyData.major) {
      alert("Please fill out your Name and Major.");
      return;
    }

    setLoading(true);
    setProfile(null); // Clear previous results
    
    // 3. Package the file and dynamic survey data
    const formData = new FormData();
    formData.append('document', file);
    formData.append('survey', JSON.stringify(surveyData));

    try {
      // Send to your backend
      const response = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(response.data);
    } catch (error) {
      console.error("Error generating profile", error);
      alert("Something went wrong! Check the terminal running your backend.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#2c3e50' }}>TU-K Intelligent Mapping System</h1>
        <p style={{ color: '#7f8c8d' }}>Upload your project report or coursework abstract to discover your marketable services.</p>
      </div>
      
      {/* --- SURVEY FORM --- */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
        <h3>Step 1: Student Details</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <input 
            type="text" name="name" placeholder="Full Name" 
            value={surveyData.name} onChange={handleInputChange}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
          <input 
            type="text" name="major" placeholder="Academic Major (e.g., Information Science)" 
            value={surveyData.major} onChange={handleInputChange}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        <input 
          type="text" name="career_goal" placeholder="Dream Career Goal (Optional)" 
          value={surveyData.career_goal} onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
        />
      </div>

      {/* --- FILE UPLOAD --- */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>Step 2: Academic Document</h3>
          <input type="file" accept=".pdf,.txt" onChange={handleFileChange} />
        </div>
        <button 
          onClick={handleUpload} 
          disabled={loading} 
          style={{ 
            padding: '12px 24px', backgroundColor: loading ? '#95a5a6' : '#3498db', 
            color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px', fontWeight: 'bold'
          }}
        >
          {loading ? '🤖 Analyzing with Llama...' : 'Generate Profile Dashboard'}
        </button>
      </div>

      {/* --- RESULTS DASHBOARD --- */}
      {profile && (
        <div style={{ marginTop: '40px', padding: '30px', border: '1px solid #e1e8ed', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{surveyData.name}'s Profile</h2>
          <p style={{ fontSize: '18px', color: '#34495e', fontStyle: 'italic' }}>"{profile.bio}"</p>
          
          <div style={{ display: 'flex', gap: '40px', marginTop: '30px' }}>
            
            {/* Skills Column */}
            <div style={{ flex: 1 }}>
              <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Extracted Skills</h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                {profile.acquired_skills && profile.acquired_skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            {/* Services Column */}
            <div style={{ flex: 2 }}>
              <h3 style={{ borderBottom: '2px solid #2ecc71', paddingBottom: '10px' }}>Marketable Services</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                {profile.marketable_services && profile.marketable_services.map((service, index) => (
                  <div key={index} style={{ padding: '20px', background: '#fff', borderRadius: '8px', borderLeft: '5px solid #2ecc71', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{service.service_name}</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#7f8c8d', lineHeight: '1.5' }}>{service.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;