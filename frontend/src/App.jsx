import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// Modular Components
import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';
import OnboardingView from './components/OnboardingView';
import AdminDashboardView from './components/AdminDashboardView';
import Navbar from './components/Navbar';
import ProfileSettings from './components/ProfileSettings';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Determine isAdmin status globally
  const isAdmin = user?.email === 'kariukilewis04@students.tukenya.ac.ke';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Use local check for immediate routing
        const isUserAdmin = currentUser.email === 'kariukilewis04@students.tukenya.ac.ke';
        setView(isUserAdmin ? 'admin_dashboard' : 'onboarding');
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
    setView('landing');
  };

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
      {/* 2. DYNAMIC NAVBAR */}
      <Navbar 
        user={user} 
        isAdmin={isAdmin} 
        view={view} 
        setView={setView} 
        handleLogout={handleLogout} 
      />

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
             <h3 className="text-2xl font-bold text-slate-900">AI is mapping your potential...</h3>
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

        {/* 3. SETTINGS VIEW */}
        {view === 'settings' && <ProfileSettings user={user} isAdmin={isAdmin} />}
      </main>
    </div>
  );
}

export default App;
