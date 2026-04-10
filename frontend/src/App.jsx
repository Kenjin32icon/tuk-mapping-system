import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { BrainCircuit, LogOut, UploadCloud, LayoutDashboard, Menu, X } from 'lucide-react';

// New Modular Components
import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setView(currentUser.email.endsWith('@tukenya.ac.ke') ? 'admin_dashboard' : 'dashboard');
      } else {
        setView('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (role) => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) { console.error("Login Error", e); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    setMasterProfile(null);
    setMenuOpen(false);
  };

  const downloadPDF = () => {
    const element = document.getElementById('master-dashboard-export');
    const opt = {
      margin: 0.5,
      filename: `${user?.displayName}_TUK_Market_Mapping.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, // Fix for profile pictures
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Analysis Logic
  const handleProcessDocuments = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    
    setLoading(true);
    setView('processing');
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('documents', f));
      
      const res = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      setView('dashboard');
    } catch (e) { alert("Analysis failed"); setView('dashboard'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
          <BrainCircuit className="w-8 h-8" />
          <span>TUK Mapping</span>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
             <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-slate-50 rounded-lg">
                {menuOpen ? <X /> : <Menu />}
             </button>
             {menuOpen && (
               <div className="absolute right-6 top-16 w-48 bg-white shadow-xl border border-slate-100 rounded-2xl py-2 animate-in slide-in-from-top-2">
                  <button onClick={() => {setView('dashboard'); setMenuOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm"><LayoutDashboard className="w-4 h-4"/> Dashboard</button>
                  <label className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm cursor-pointer"><UploadCloud className="w-4 h-4"/> Upload New<input type="file" multiple className="hidden" onChange={handleProcessDocuments}/></label>
                  <hr className="my-2" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"><LogOut className="w-4 h-4"/> Logout</button>
               </div>
             )}
          </div>
        )}
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        {view === 'landing' && <LandingView onLogin={handleLogin} />}
        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-bold text-slate-600">AI is mapping your potential...</p>
          </div>
        )}
        {view === 'dashboard' && <DashboardView user={user} profile={profile} masterProfile={masterProfile} onDownload={downloadPDF} />}
      </main>
    </div>
  );
}

export default App;
