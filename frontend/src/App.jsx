// App.jsx
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
import SkillsModuleView from './components/SkillsModuleView';
import MarketModuleView from './components/MarketModuleView';
import ServicesModuleView from './components/ServicesModuleView';
import PortfolioView from './components/PortfolioView';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'STUDENT', 'SUPER_ADMIN', etc.
  const [view, setView] = useState('landing');
  
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          // Ask the database for this user's official role
          const response = await axios.post('http://localhost:5000/api/sync-user', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const role = response.data.role;
          setUserRole(role);

          // Route them based on their OFFICIAL database role
          if (role === 'SUPER_ADMIN') {
              setView('dev_dashboard');
          } else if (role === 'UNIVERSITY_ADMIN') {
              setView('admin_dashboard');
          } else if (role === 'GOVT_ADMIN') {
              setView('govt_dashboard'); 
          } else {
              setView('onboarding'); // Default Student Route
          }
        } catch (error) {
          console.error("Failed to fetch user role.");
        }
      } else {
        setView('landing');
        setUserRole(null);
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
    setPortfolioData(null);
    setUserRole(null);
  };

  const handleProcessDocuments = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    setLoading(true);
    setView('processing');
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('documents', file));
    
    try {
      const token = await user.getIdToken();
      const response = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setProfile(response.data);
      setView('dashboard');
    } catch (error) {
      console.error(error);
      alert("Error analyzing documents.");
      setView('onboarding');
    }
    setLoading(false);
  };

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
      console.error(error);
      alert("Could not generate Master Profile. Make sure you have uploaded at least 2 documents in the past.");
      setView('dashboard');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePreparePortfolio = async (service) => {
    setIsGeneratingPortfolio(true);
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
        alert("Failed to generate portfolio.");
        setView('module_services');
    } finally {
        setIsGeneratingPortfolio(false);
    }
  };

  const downloadPDF = (elementId) => {
    const element = document.getElementById(elementId);
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
        userRole={userRole} 
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
            onSkip={() => setView('dashboard')}
          />
        )}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
             <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {isSynthesizing ? 'Synthesizing Master Profile...' : isGeneratingPortfolio ? 'Crafting Portfolio Blueprint...' : 'AI is mapping your potential...'}
                </h3>
             </div>
          </div>
        )}

        {/* Dynamic Dashboards */}
        {view === 'dashboard' && (
          <DashboardView 
            user={user} 
            profile={profile} 
            masterProfile={masterProfile} 
            onDownload={() => downloadPDF('master-dashboard-export')}
            onGenerateMaster={handleGenerateMasterProfile}
            isSynthesizing={isSynthesizing} 
          />
        )}
        
        {view === 'admin_dashboard' && <AdminDashboardView />}
        {view === 'dev_dashboard' && <div className="p-8 bg-white rounded-3xl shadow-xl"><h2>Developer Super-Panel</h2><p>Full system access granted.</p></div>}
        {view === 'settings' && <ProfileSettings user={user} isAdmin={userRole === 'SUPER_ADMIN'} />}

        {/* Master Modules Routing */}
        {view === 'module_skills' && <SkillsModuleView masterProfile={masterProfile} />}
        {view === 'module_market' && <MarketModuleView masterProfile={masterProfile} />}
        {view === 'module_services' && <ServicesModuleView masterProfile={masterProfile} onPrepare={handlePreparePortfolio} />}
        {view === 'module_portfolio' && <PortfolioView portfolioData={portfolioData} onBack={() => setView('module_services')} onDownload={() => downloadPDF('portfolio-export')} />}
      </main>
    </div>
  );
}

export default App;
