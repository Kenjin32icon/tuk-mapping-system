import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase'; // Ensure you have firebase.js configured

// Recharts imports
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis // <-- UPDATED IMPORTS
} from 'recharts';

// --- NEW COMPONENTS FOR NAVIGATION ---

// 1. Documents & History View
function DocumentsView({ history }) {
  return (
    <div style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#2c3e50' }}>Your Analyzed Documents</h2>
      {history.length === 0 ? (
        <p style={{ color: '#7f8c8d' }}>You haven't analyzed any documents yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {history.map((item, index) => (
            <div key={index} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', background: '#f9f9f9' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#3498db' }}>
                Analysis from {new Date(item.createdAt).toLocaleDateString()}
              </h4>
              <p style={{ margin: '5px 0' }}><strong>Major:</strong> {item.surveyAnswers?.major || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Employability Score:</strong> {item.generatedProfile?.employability_score}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. Statistics View
function StatisticsView({ history }) {
  const trendData = history.map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString(),
    score: item.generatedProfile?.employability_score || 0
  })).reverse();

  return (
    <div style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#2c3e50' }}>Your Progress Statistics</h2>
      <p style={{ color: '#7f8c8d' }}>Track how your employability score has changed over time.</p>
      
      {trendData.length > 0 ? (
        <div style={{ width: '100%', height: 350, marginTop: '30px' }}>
          <ResponsiveContainer>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Bar dataKey="score" fill="#3498db" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p style={{ marginTop: '20px' }}>Upload more documents to see your progress trends!</p>
      )}
    </div>
  );
}

// 3. Settings View
function SettingsView({ user }) {
  return (
    <div style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#2c3e50' }}>Profile Settings</h2>
      <div style={{ marginTop: '20px', lineHeight: '2' }}>
        <p><strong>Display Name:</strong> {user?.displayName}</p>
        <p><strong>Email Address:</strong> {user?.email}</p>
        <p><strong>Account ID:</strong> <code style={{ background: '#eee', padding: '2px 5px' }}>{user?.uid}</code></p>
      </div>
      <button style={{ marginTop: '20px', padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Edit Profile Information
      </button>
      <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '20px' }}>
        Note: Core details are managed by your Google account.
      </p>
    </div>
  );
}

// --- ANALYTICS DASHBOARD COMPONENT ---
function AnalyticsDashboard({ analyticsData }) {
  const COLORS = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6'];
  if (!analyticsData) return null;
  const { totalStudents, averageScore, chartData, topSkills } = analyticsData;

  return (
    <div style={{ marginTop: '50px', padding: '30px', background: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>Your Personal Career Analytics</h2>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#7f8c8d', margin: 0 }}>Documents Analyzed</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0' }}>{totalStudents ?? 0}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#7f8c8d', margin: 0 }}>Avg. Employability</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '5px 0', color: '#2ecc71' }}>{averageScore ?? 0}%</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, height: 300 }}>
          <h3 style={{ fontSize: '16px', color: '#34495e', textAlign: 'center' }}>Employability Scores</h3>
          <ResponsiveContainer>
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
        <div style={{ flex: 1, height: 300 }}>
          <h3 style={{ fontSize: '16px', color: '#34495e', textAlign: 'center' }}>Top Technical Skills Heatmap</h3>
          <ResponsiveContainer>
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

// --- MAIN APP COMPONENT ---
function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userHistory, setUserHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [surveyData, setSurveyData] = useState({ name: '', major: '', career_goal: '' });
  
  // NEW STATES FOR MASTER PROFILE
  const [masterProfile, setMasterProfile] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && (activeTab === 'documents' || activeTab === 'statistics')) {
      fetchUserHistory();
    }
  }, [user, activeTab]);

  const fetchUserHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/user-history/${user.uid}`);
      setUserHistory(response.data.history);
    } catch (error) {
      console.error("Error fetching history", error);
    }
  };

  // NEW: FUNCTION TO GENERATE MASTER PROFILE
  const generateMasterProfile = async () => {
    if (!user) return;
    setIsSynthesizing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/synthesize-profile', {
        userId: user.uid,
        userEmail: user.email
      });
      setMasterProfile(response.data);
      setActiveTab('dashboard'); 
    } catch (error) {
      console.error("Error generating master profile", error);
      alert("Please upload at least one document first!");
    }
    setIsSynthesizing(false);
  };

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Login Failed", error); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    setMasterProfile(null);
    setFiles([]);
    setAnalyticsData(null);
    setActiveTab('dashboard');
  };

  const handleInputChange = (e) => {
    setSurveyData({ ...surveyData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
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
    formData.append('userId', user.uid);
    formData.append('userEmail', user.email);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f4f7f6' }}>
        <h1>TU-K Mapping System</h1>
        <button onClick={handleLogin} style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '20px' }}/>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Arial, sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <div style={{ width: '250px', background: '#2c3e50', color: '#ecf0f1', padding: '30px 20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '40px', textAlign: 'center' }}>TU-K BI System</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'documents', label: '📁 My Documents' },
              { id: 'statistics', label: '📈 Statistics' },
              { id: 'settings', label: '⚙️ Settings' }
            ].map((item) => (
              <li 
                key={item.id} 
                onClick={() => setActiveTab(item.id)}
                style={{
                  padding: '12px 15px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === item.id ? '#3498db' : 'transparent',
                  transition: '0.3s'
                }}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>{activeTab.toUpperCase()}</h1>
          <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* SYNTHESIZE BANNER */}
            <div style={{ textAlign: 'center', backgroundColor: '#f0fdf4', border: '2px dashed #2ecc71', padding: '25px', borderRadius: '12px' }}>
              <h2>Synthesize Your Portfolio</h2>
              <p>Combine all your uploaded coursework into one ultimate Master Profile.</p>
              <button 
                onClick={generateMasterProfile} 
                disabled={isSynthesizing}
                style={{ padding: '12px 25px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isSynthesizing ? '🧠 Synthesizing Database...' : '✨ Generate Master Profile'}
              </button>
            </div>

            {/* Input Form Section */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3>Generate New Analysis</h3>
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                <input type="text" name="name" placeholder="Full Name" value={surveyData.name} onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input type="text" name="major" placeholder="Major" value={surveyData.major} onChange={handleInputChange} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <input type="file" multiple onChange={handleFileChange} style={{ marginTop: '15px' }} />
              <button onClick={handleUpload} disabled={loading} style={{ marginTop: '15px', width: '100%', padding: '12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {loading ? '🤖 Analyzing Portfolio...' : 'Generate Profile Dashboard'}
              </button>
            </div>

            {/* MASTER PROFILE DISPLAY */}
            {masterProfile && (
              <div style={{ marginTop: '20px', borderTop: '5px solid #3498db', background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h1 style={{ color: '#2c3e50', margin: '0' }}>{masterProfile.professional_title}</h1>
                  <p style={{ color: '#7f8c8d', fontSize: '18px', maxWidth: '800px', margin: '15px auto' }}>
                    {masterProfile.bio}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                  {/* Skills Section */}
                  <div>
                    <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Categorized Skills</h3>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#27ae60' }}>Technical</h4>
                        <ul>{masterProfile.skills?.technical?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#e67e22' }}>Soft Skills</h4>
                        <ul>{masterProfile.skills?.soft?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    </div>
                  </div>

                  {/* Probability Chart Section */}
                  <div>
                    <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Service Match Probability</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masterProfile.services}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="service_name" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Match %" dataKey="match_percentage" stroke="#3498db" fill="#3498db" fillOpacity={0.6} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Marketable Services Detail */}
                <div style={{ marginTop: '30px' }}>
                  <h3>Detailed Service Offerings</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    {masterProfile.services?.map((svc, i) => (
                      <div key={i} style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '5px solid #3498db' }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>{svc.service_name}</h4>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3498db' }}>Match: {svc.match_percentage}%</span>
                        <p style={{ marginTop: '10px', fontSize: '14px', lineHeight: '1.4' }}>{svc.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Individual Profile Result Section */}
            {profile && !masterProfile && (
              <div id="student-profile-report" style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <h2>{surveyData.name}'s Result</h2>
                <p><i>"{profile.bio}"</i></p>
                <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h3>Skills</h3>
                    <p><strong>Technical:</strong> {profile.technical_skills?.join(', ')}</p>
                    <p><strong>Soft:</strong> {profile.soft_skills?.join(', ')}</p>
                  </div>
                </div>
                <AnalyticsDashboard analyticsData={profile?.analyticsData} />
                <button onClick={downloadPDF} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '5px' }}>
                  📥 Download as PDF
                </button>
              </div>
            )}
          </div>
        )}

        {/* Conditional Tab Rendering */}
        {activeTab === 'documents' && <DocumentsView history={userHistory} />}
        {activeTab === 'statistics' && <StatisticsView history={userHistory} />}
        {activeTab === 'settings' && <SettingsView user={user} />}

      </main>
    </div>
  );
}

export default App;