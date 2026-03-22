import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Add some basic CSS for styling

function App() {
  const [file, setFile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(response.data);
    } catch (error) {
      console.error("Error generating profile", error);
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>TU-K Intelligent Mapping System</h1>
      <p>Upload your project report or coursework abstract to discover your marketable services.</p>
      
      <input type="file" accept=".pdf,.txt" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} style={{ padding: '10px', marginLeft: '10px' }}>
        {loading ? 'Analyzing with Llama 3.2...' : 'Generate Profile Dashboard'}
      </button>

      {/* Profile Dashboard UI */}
      {profile && (
        <div className="dashboard" style={{ marginTop: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>{profile.name}</h2>
          <p><strong>Academic Focus:</strong> {profile.bio}</p>
          
          <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
            <div className="skills-section" style={{ flex: 1 }}>
              <h3>Extracted Skills</h3>
              <ul>
                {profile.skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className="services-section" style={{ flex: 2 }}>
              <h3>Marketable Services</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {profile.services.map((service, index) => (
                  <div key={index} style={{ padding: '15px', background: '#f9f9f9', borderRadius: '5px', borderLeft: '4px solid #007bff' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>{service.serviceName}</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>{service.description}</p>
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
