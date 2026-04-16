import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';
import OnboardingView from './components/OnboardingView';
import AdminDashboardView from './components/AdminDashboardView';
import Navbar from './components/Navbar';
import ProfileSettings from './components/ProfileSettings';
import SkillsModuleView from './components/SkillsModuleView';
import MarketModuleView from './components/MarketModuleView';
import ServicesModuleView from './components/ServicesModuleView';
import PortfolioView from './components/PortfolioView'; // NEW IMPORT

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null); // NEW STATE
  const [loading, setLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

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

  const handleSkipToDashboard = () => setView('dashboard');

  const handleGenerateMasterProfile = async () => {
    setIsSynthesizing(true);
    setView('processing');
    try {
      const token = await user.getIdToken();
      const response = await axios.post('http://localhost:5000/api/synthesize-profile', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMasterProfile(response.data);
      setView('dashboard');
    } catch (error) {
      alert("Synthesis failed. You need 2+ documents.");
      setView('dashboard');
    } finally { setIsSynthesizing(false); }
  };

  // NEW: Portfolio Generation Handler
  const handlePreparePortfolio = async (service) => {
    setIsSynthesizing(true); // Reuse synthesizing state for loading text
    setView('processing');
    try {
        const token = await user.getIdToken();
        const response = await axios.post('http://localhost:5000/api/generate-portfolio', {
            masterProfile,
            serviceName: service.service_name,
            serviceDescription: service.description
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setPortfolioData(response.data);
        setView('module_portfolio');
    } catch (e) {
        alert("Failed to generate portfolio blueprint.");
        setView('module_services');
    } finally { setIsSynthesizing(false); }
  };

  const handleProcessDocuments = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setLoading(true); setView('processing');
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('documents', f));
      const res = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      setView('dashboard');
    } catch (e) { alert("Analysis failed"); setView('onboarding'); }
    setLoading(false);
  };

  const downloadPDF = (elementId = 'master-dashboard-export') => {
    const element = document.getElementById(elementId);
    const opt = {
      margin: 0.5,
      filename: `${user?.displayName}_Profile.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar 
        user={user} isAdmin={isAdmin} view={view} setView={setView} 
        handleLogout={handleLogout} masterProfile={masterProfile}
        onGenerateMaster={handleGenerateMasterProfile} 
      />

      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        {view === 'landing' && <LandingView onLogin={handleLogin} />}
        {view === 'onboarding' && <OnboardingView user={user} onFileChange={handleProcessDocuments} isUploading={loading} onSkip={handleSkipToDashboard}/>}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
             <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <h3 className="text-2xl font-bold text-slate-900">
                {portfolioData && !isSynthesizing ? 'Finalizing Blueprint...' : (isSynthesizing ? 'AI is Architecting...' : 'Mapping Potential...')}
             </h3>
          </div>
        )}

        {view === 'dashboard' && <DashboardView user={user} profile={profile} masterProfile={masterProfile} onDownload={() => downloadPDF('master-dashboard-export')} onGenerateMaster={handleGenerateMasterProfile} isSynthesizing={isSynthesizing} />}
        {view === 'admin_dashboard' && <AdminDashboardView />}
        {view === 'settings' && <ProfileSettings user={user} isAdmin={isAdmin} />}
        {view === 'module_skills' && <SkillsModuleView masterProfile={masterProfile} />}
        {view === 'module_market' && <MarketModuleView masterProfile={masterProfile} />}
        
        {/* UPDATED MODULES */}
        {view === 'module_services' && <ServicesModuleView masterProfile={masterProfile} onPrepare={handlePreparePortfolio} />}
        {view === 'module_portfolio' && <PortfolioView portfolioData={portfolioData} onBack={() => setView('module_services')} onDownload={() => downloadPDF('portfolio-export')} />}
      </main>
    </div>
  );
}

export default App;
