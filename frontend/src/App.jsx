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
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Determine isAdmin status globally
  const isAdmin = user?.email === 'kariukilewis04@students.tukenya.ac.ke';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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

  // 1. Function to handle "Skip this step"
  const handleSkipToDashboard = () => {
    setView('dashboard');
  };

  // 2. Function to Generate Master Profile
  const handleGenerateMasterProfile = async () => {
    setIsSynthesizing(true);
    setView('processing'); // Show loading screen
    try {
      const token = await user.getIdToken();
      const response = await axios.post('http://localhost:5000/api/synthesize-profile', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMasterProfile(response.data);
      setView('dashboard'); // Route back to the now-populated Master Dashboard
    } catch (error) {
      console.error(error);
      alert("Could not generate Master Profile. Make sure you have uploaded at least 2 documents in the past.");
      setView('dashboard');
    } finally {
      setIsSynthesizing(false);
    }
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
      <Navbar 
        user={user} 
        isAdmin={isAdmin} 
        view={view} 
        setView={setView} 
        handleLogout={handleLogout} 
        masterProfile={masterProfile}
        onGenerateMaster={handleGenerateMasterProfile} 
      />

      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        {view === 'landing' && <LandingView onLogin={handleLogin} />}
        
        {view === 'onboarding' && (
          <OnboardingView 
            user={user} 
            onFileChange={handleProcessDocuments} 
            isUploading={loading} 
            onSkip={handleSkipToDashboard}
          />
        )}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
             <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <h3 className="text-2xl font-bold text-slate-900">
                {isSynthesizing ? 'Synthesizing Master Profile...' : 'AI is mapping your potential...'}
             </h3>
          </div>
        )}

        {view === 'dashboard' && (
          <DashboardView 
            user={user} 
            profile={profile} 
            masterProfile={masterProfile} 
            onDownload={downloadPDF}
            onGenerateMaster={handleGenerateMasterProfile}
            isSynthesizing={isSynthesizing} 
          />
        )}

        {view === 'admin_dashboard' && <AdminDashboardView />}
        {view === 'settings' && <ProfileSettings user={user} isAdmin={isAdmin} />}

        {/* NEW MODULE ROUTING (Create these components later) */}
        {view === 'module_skills' && <div className="text-center p-10"><h2 className="text-2xl font-bold">Skills Module</h2><p className="text-slate-500">Component coming soon...</p></div>}
        {view === 'module_market' && <div className="text-center p-10"><h2 className="text-2xl font-bold">Market Module</h2><p className="text-slate-500">Component coming soon...</p></div>}
        {view === 'module_services' && <div className="text-center p-10"><h2 className="text-2xl font-bold">Services Module</h2><p className="text-slate-500">Component coming soon...</p></div>}
      </main>
    </div>
  );
}

export default App;
