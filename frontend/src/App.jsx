import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase'; // Ensure you have firebase.js configured

// Recharts imports for AnalyticsDashboard
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

function AnalyticsDashboard({ analyticsData }) {
  // BI Color Palette
  const COLORS = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6'];

  if (!analyticsData) return null;
  const { totalStudents, averageScore, chartData, topSkills } = analyticsData;

  return (
    <div
      style={{
        marginTop: '50px',
        padding: '30px',
        background: '#fff',
        borderRadius: '15px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}
    >
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
        Your Personal Career Analytics
      </h2>

      {/* KPI Cards */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '40px' }}>
        <div className="kpi-card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#7f8c8d', margin: 0 }}>Documents Analyzed</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0' }}>
            {totalStudents ?? 0}
          </p>
        </div>

        <div className="kpi-card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#7f8c8d', margin: 0 }}>Avg. Employability</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0', color: '#2ecc71' }}>
            {averageScore ?? 0}%
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Employability Bar Chart */}
        <div style={{ flex: 1, height: 300 }}>
          <h3 style={{ fontSize: '16px', color: '#34495e', textAlign: 'center' }}>
            Employability Scores
          </h3>
          <ResponsiveContainer>
            {/* NEW: Added || [] to prevent .length crashes */}
            <BarChart data={chartData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                {(chartData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skills Heatmap */}
        <div style={{ flex: 1, height: 300 }}>
          <h3 style={{ fontSize: '16px', color: '#34495e', textAlign: 'center' }}>
            Top Technical Skills Heatmap
          </h3>
          <ResponsiveContainer>
            {/* NEW: Added || [] to prevent .length crashes */}
            <BarChart data={topSkills || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Bar dataKey="count" fill="#e74c3c" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function App() {
  // --- Auth State ---
  const [user, setUser] = useState(null);
  
  // --- Profile & UI State ---
  const [files, setFiles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [surveyData, setSurveyData] = useState({
    name: '',
    major: '',
    career_goal: ''
  });

  // Check login status on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    setFiles([]);
    setAnalyticsData(null);
  };

  const handleInputChange = (e) => {
    setSurveyData({
      ...surveyData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const downloadPDF = () => {
    const element = document.getElementById('student-profile-report');
    const opt = {
      margin: 10,
      filename: `${surveyData.name}_Career_Mapping.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please upload at least one document.");
    if (!surveyData.name || !surveyData.major) return alert("Name and Major are required.");

    setLoading(true);
    setProfile(null); 
    setAnalyticsData(null); 

    const formData = new FormData();
    files.forEach((file) => formData.append('documents', file));
    formData.append('survey', JSON.stringify(surveyData));
    
    // Attach Auth credentials to payload
    formData.append('userId', user.uid);
    formData.append('userEmail', user.email);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/analyze-data',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setProfile(response.data);
      if (response.data?.analyticsData) {
        setAnalyticsData(response.data.analyticsData);
      }
    } catch (error) {
      console.error("Error generating profile", error);
      alert("Something went wrong!");
    }
    setLoading(false);
  };

  // --- LOGIN SCREEN UI ---
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f4f7f6' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>TU-K Mapping System</h1>
        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Securely analyze your coursework and build your career profile.</p>
        <button 
          onClick={handleLogin}
          style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', backgroundColor: 'white', borderRadius: '50%', padding: '2px' }}/>
          Sign in with Google
        </button>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <div>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>TU-K Intelligent Mapping System</h1>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Welcome back, {user.displayName}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
        <h3>Step 1: Student Details</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <input type="text" name="name" placeholder="Full Name" value={surveyData.name} onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="text" name="major" placeholder="Academic Major" value={surveyData.major} onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <input type="text" name="career_goal" placeholder="Dream Career Goal (Optional)" value={surveyData.career_goal} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
      </div>

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>Step 2: Academic Documents</h3>
          <input type="file" multiple accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} />
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
            {files.length > 0 ? `${files.length} file(s) selected` : "Supported: PDF, DOCX, PNG, JPG, TXT"}
          </p>
        </div>
        <button onClick={handleUpload} disabled={loading} style={{ padding: '12px 24px', backgroundColor: loading ? '#95a5a6' : '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          {loading ? '🤖 Analyzing Portfolio...' : 'Generate Profile Dashboard'}
        </button>
      </div>

      {profile && (
        <>
          <div id="student-profile-report" style={{ marginTop: '40px', padding: '30px', border: '1px solid #e1e8ed', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', background: '#fff' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{surveyData.name}'s Profile</h2>
            <p style={{ fontSize: '18px', color: '#34495e', fontStyle: 'italic' }}>"{profile.bio}"</p>

            <div style={{ display: 'flex', gap: '40px', marginTop: '30px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#2c3e50' }}>Technical Skills</h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6', marginBottom: '20px' }}>
                  {profile.technical_skills?.map((skill, index) => <li key={index}><strong>{skill}</strong></li>)}
                </ul>
                <h3 style={{ borderBottom: '2px solid #f39c12', paddingBottom: '10px', color: '#2c3e50' }}>Soft Skills</h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                  {profile.soft_skills?.map((skill, index) => <li key={index}>{skill}</li>)}
                </ul>
              </div>

              <div style={{ flex: 2 }}>
                <h3 style={{ borderBottom: '2px solid #2ecc71', paddingBottom: '10px' }}>Marketable Services</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                  {profile.marketable_services?.map((service, index) => (
                    <div key={index} style={{ padding: '20px', background: '#fff', borderRadius: '8px', borderLeft: '5px solid #2ecc71', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{service.service_name}</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#7f8c8d', lineHeight: '1.5' }}>{service.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analytics dashboard under individual profile */}
            {/* NEW: Ensure it pulls safely from the profile state */}
            <AnalyticsDashboard analyticsData={profile?.analyticsData} />
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button onClick={downloadPDF} style={{ padding: '15px 30px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)' }}>
              📥 Download Profile as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;