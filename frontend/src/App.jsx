import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase'; 
import { 
  Menu, X, UploadCloud, BrainCircuit, BarChart3, 
  FileText, TrendingUp, Settings, LogOut, LayoutDashboard 
} from 'lucide-react';

// Recharts imports for visualization
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// --- MODULE 4: Statistics Visualization Component ---
function AnalyticsDashboard({ analyticsData, masterProfile }) {
  const radarData = masterProfile?.acquired_skills?.slice(0, 6).map((skill) => ({
    subject: skill.length > 12 ? skill.substring(0, 12) + '...' : skill, 
    A: 70 + (Math.random() * 30), 
    fullMark: 100,
  })) || [];

  if (!analyticsData && !masterProfile) {
    return (
      <div className="w-full h-48 bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-300">
        <BarChart3 className="w-10 h-10 text-slate-300" />
        <span className="ml-2 text-slate-400 font-medium">Upload data to view mapping</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        {masterProfile ? (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
            <Radar name="Skill Strength" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
            <Tooltip />
          </RadarChart>
        ) : (
          <BarChart data={analyticsData?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// --- VIEW 1: LANDING PAGE ---
function LandingView({ onLogin }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in duration-700">
      <div className="max-w-2xl bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <BrainCircuit className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Turn Your University Work into Marketable Skills
        </h2>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Our Intelligent Mapping System analyses your academic reports, projects, and assignments to discover your hidden professional strengths.
        </p>
        <button 
          onClick={onLogin}
          className="flex items-center justify-center gap-3 w-full sm:w-auto mx-auto px-8 py-4 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 font-semibold rounded-xl transition-all shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          Sign in with Google to Begin
        </button>
      </div>
    </div>
  );
}

// --- VIEW 2: ONBOARDING & UPLOAD ---
function OnboardingView({ user, onProcess, isUploading, files, onFileChange }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold mb-4">Welcome, {user?.displayName?.split(' ')[0]}!</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Simply upload your university materials below. You can select multiple documents at once (e.g., projects, essays).
        </p>
        
        <div 
          onClick={() => document.getElementById('file-upload').click()}
          className="border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-xl p-10 text-center transition-all hover:bg-emerald-100 cursor-pointer"
        >
          <UploadCloud className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">
            {files.length > 0 ? `${files.length} documents selected` : "Select or drop multiple documents here"}
          </h3>
          <p className="text-sm text-emerald-600 mb-6">Supports PDF and Word Documents (.docx)</p>
          
          <input 
            type="file" 
            multiple 
            onChange={onFileChange} 
            className="hidden" 
            id="file-upload" 
          />
          <span className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium shadow-md">
            Browse Files
          </span>
        </div>

        {files.length > 0 && (
          <ul className="mt-4 text-sm text-slate-500 space-y-1">
            {files.map((f, i) => <li key={i} className="flex items-center gap-2"><FileText className="w-4 h-4"/> {f.name}</li>)}
          </ul>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onProcess}
            disabled={files.length === 0 || isUploading}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Analyse My Documents →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- VIEW 3: PROCESSING ENGINE ---
function ProcessingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600"></div>
        <BrainCircuit className="w-10 h-10 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Engine Processing...</h2>
      <div className="text-slate-500 space-y-2 text-center animate-pulse">
        <p>Extracting text from documents...</p>
        <p className="text-emerald-600 font-medium">Mapping identified skills to market demands...</p>
      </div>
    </div>
  );
}

// --- VIEW 4: MODULAR DASHBOARD ---
function DashboardView({ user, profile, masterProfile, analyticsData, onDownload }) {
  const currentProfile = masterProfile || profile;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" id="student-profile-report">
      
      {/* MODULE 1: User Details */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-6">
        <img src={user?.photoURL || "https://via.placeholder.com/150"} alt="Profile" className="w-20 h-20 rounded-full border-4 border-emerald-100" />
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{user?.displayName}</h2>
          <p className="text-slate-500">{currentProfile?.professional_title || "Student Researcher"}</p>
          <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            Market Readiness: {currentProfile?.employability_score || '0'}/100
          </div>
        </div>
        <button onClick={onDownload} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MODULE 2: Skills Module */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1 md:col-span-2 flex flex-col md:flex-row gap-6">
          <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" /> Technical Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(currentProfile?.acquired_skills || []).map((s, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">{s}</span>
              ))}
            </div>
          </div>
          <div className="flex-1 md:pl-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-emerald-500" /> Soft Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(currentProfile?.soft_skills || []).map((s, i) => (
                <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* MODULE 3: Services */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" /> Marketable Services
          </h3>
          <div className="space-y-4">
            {(currentProfile?.marketable_services || []).map((service, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl border-l-4 border-l-blue-500">
                <h4 className="font-semibold text-slate-800">{service.service_name}</h4>
                <p className="text-sm text-slate-600 mt-1">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MODULE 4: Visualization */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-800 mb-4 self-start flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-600" /> Market Potential Mapping
          </h3>
          <AnalyticsDashboard analyticsData={analyticsData} masterProfile={masterProfile} />
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [userHistory, setUserHistory] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setView('dashboard');
        await fetchUserHistory(currentUser);
      } else {
        setView('landing');
      }
      setIsAppLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Secure History Fetch with Token
  const fetchUserHistory = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get(`http://localhost:5000/api/user-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserHistory(res.data.history);
      if (res.data.history.length > 0) {
        setProfile(res.data.history[0].generatedProfile);
        // Assuming analytics is also protected
        const analyticRes = await axios.get(`http://localhost:5000/api/analytics/${currentUser.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalyticsData(analyticRes.data);
      }
    } catch (e) { console.error("History fetch error", e); }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setView('onboarding');
    } catch (e) { console.error("Login failed", e); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
    setProfile(null);
    setMasterProfile(null);
    setUserHistory([]);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  // Secure Multi-Document Processing with Token
  const handleProcessDocuments = async () => {
    if (files.length === 0 || !user) {
      return alert("Select at least one document!");
    }
    
    setLoading(true);
    setView('processing');
    
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('documents', file); 
      });
      
      const response = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
        }
      });
      
      setProfile(response.data);
      setView('dashboard');
      setFiles([]); 
      fetchUserHistory(user); // Refresh history list
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Something went wrong during analysis.");
      setView('onboarding');
    }
    setLoading(false);
  };

  // Secure Master Profile Synthesis with Token
  const generateMaster = async () => {
    if (!user) return alert("Log in first!");
    setIsSynthesizing(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.post('http://localhost:5000/api/synthesize-profile', 
        { userId: user.uid }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMasterProfile(response.data);
      setMenuOpen(false);
      setView('dashboard');
    } catch (e) { 
      console.error("Synthesis Error:", e);
      alert("Synthesis failed."); 
    }
    setIsSynthesizing(false);
  };

  const downloadPDF = () => {
    const element = document.getElementById('student-profile-report');
    const opt = { margin: 1, filename: 'Market_Readiness_Report.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
  };

  if (isAppLoading) return <ProcessingView />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
          <BrainCircuit className="w-6 h-6" />
          Intelligent Mapping System
        </h1>
        
        {user && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => {setView('dashboard'); setMenuOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> My Dashboard
                </button>
                <button onClick={() => {setView('onboarding'); setMenuOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" /> Upload New
                </button>
                {userHistory.length >= 2 && (
                  <button 
                    onClick={generateMaster} 
                    disabled={isSynthesizing}
                    className="w-full text-left px-4 py-2 hover:bg-purple-50 text-purple-700 text-sm flex items-center gap-2 disabled:text-slate-400"
                  >
                    <BrainCircuit className="w-4 h-4" /> 
                    {isSynthesizing ? 'Synthesizing...' : 'Generate Master Profile'}
                  </button>
                )}
                <hr className="my-1 border-slate-100" />
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {view === 'landing' && <LandingView onLogin={handleLogin} />}
        {view === 'onboarding' && (
          <OnboardingView 
            user={user} 
            onProcess={handleProcessDocuments} 
            isUploading={loading} 
            files={files} 
            onFileChange={handleFileChange} 
          />
        )}
        {view === 'processing' && <ProcessingView />}
        {view === 'dashboard' && (
          <DashboardView 
            user={user} 
            profile={profile} 
            masterProfile={masterProfile} 
            analyticsData={analyticsData} 
            onDownload={downloadPDF}
          />
        )}
      </main>
    </div>
  );
}

export default App;