import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { BrainCircuit, LogOut, UploadCloud, LayoutDashboard, Menu, X, Settings } from 'lucide-react';

// Modular Components
import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';
import OnboardingView from './components/OnboardingView';
import AdminDashboardView from './components/AdminDashboardView';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. STRICT ADMIN CHECK: Locked to your specific account
        const isAdmin = currentUser.email === 'kariukilewis04@students.tukenya.ac.ke';
        setView(isAdmin ? 'admin_dashboard' : 'onboarding');
      } else {
        setView('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (e) { console.error("Login Error", e); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    setMasterProfile(null);
    setMenuOpen(false);
    setView('landing');
  };

  const handleProcessDocuments = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    
    setLoading(true);
    setView('processing');
    setMenuOpen(false); // Close menu if upload triggered from menu

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('documents', f));
      
      const res = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      setView('dashboard');
    } catch (e) { 
      alert("Analysis failed"); 
      setView('onboarding'); 
    }
    setLoading(false);
  };

  const downloadPDF = () => {
    const element = document.getElementById('master-dashboard-export');
    const opt = {
      margin: 0.5,
      filename: `${user?.displayName}_TUK_Profile.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* GLOBAL HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl cursor-pointer" onClick={() => user && setView(user.email === 'kariukilewis04@students.tukenya.ac.ke' ? 'admin_dashboard' : 'dashboard')}>
          <BrainCircuit className="w-8 h-8" />
          <span className="hidden md:inline">TUK Mapping</span>
        </div>
        
        {user && (
          <div className="relative">
             <button 
               onClick={() => setMenuOpen(!menuOpen)} 
               className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
             >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>

             {/* 2. ENHANCED HAMBURGER MENU */}
             {menuOpen && (
               <div className="absolute right-0 top-14 w-56 bg-white shadow-2xl border border-slate-100 rounded-2xl py-2 animate-in slide-in-from-top-4 duration-200">
                  <div className="px-4 py-2 mb-2 border-b border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-xs font-bold truncate text-emerald-600">{user.email}</p>
                  </div>

                  <button 
                    onClick={() => { setView(user.email === 'kariukilewis04@students.tukenya.ac.ke' ? 'admin_dashboard' : 'dashboard'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400"/> Dashboard
                  </button>

                  <label className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium cursor-pointer">
                    <UploadCloud className="w-4 h-4 text-slate-400"/> Upload New
                    <input type="file" multiple className="hidden" onChange={handleProcessDocuments}/>
                  </label>

                  <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Settings className="w-4 h-4 text-slate-400"/> Settings
                  </button>

                  <hr className="my-2 border-slate-50" />
                  
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm font-bold"
                  >
                    <LogOut className="w-4 h-4"/> Sign Out
                  </button>
               </div>
             )}
          </div>
        )}
      </header>

      {/* VIEW ROUTER */}
      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        {view === 'landing' && <LandingView onLogin={handleLogin} />}
        
        {view === 'onboarding' && (
          <OnboardingView 
            user={user} 
            onFileChange={handleProcessDocuments} 
            isUploading={loading} 
          />
        )}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
             <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <div>
                <h3 className="text-2xl font-bold text-slate-900">Analysing Profile</h3>
                <p className="text-slate-500 mt-1">Our AI is cross-referencing your skills with Kenyan market demands...</p>
             </div>
          </div>
        )}

        {view === 'dashboard' && (
          <DashboardView 
            user={user} 
            profile={profile} 
            masterProfile={masterProfile} 
            onDownload={downloadPDF} 
          />
        )}

        {view === 'admin_dashboard' && <AdminDashboardView />}
      </main>
    </div>
  );
}

export default App;
