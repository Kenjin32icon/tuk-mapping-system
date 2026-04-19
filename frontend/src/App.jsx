// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth'; // ✅ Added signInWithPopup
import { auth, googleProvider } from './firebase';
import { Toaster, toast } from 'react-hot-toast';

// Shared Components
import LandingView from './components/shared/LandingView';
import Navbar from './components/shared/Navbar';
import ProfileSettings from './components/shared/ProfileSettings';

// Student Components
import DashboardView from './components/student/DashboardView';
import OnboardingView from './components/student/OnboardingView';
import SkillsModuleView from './components/student/SkillsModuleView';
import MarketModuleView from './components/student/MarketModuleView';
import ServicesModuleView from './components/student/ServicesModuleView';
import PortfolioView from './components/student/PortfolioView';

// Admin Components
import AdminDashboardView from './components/admin/AdminDashboardView';

// Ensure this matches your Render URL when deployed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';

// --- MOCK DATA FOR GUEST MODE ---
const MOCK_GUEST_PROFILE = {
  bio: "A highly motivated aspiring tech professional with a strong foundation in software development. Testing system capabilities in Guest Mode.",
  skills: {
    technical: ["JavaScript", "React.js", "Node.js", "Python", "SQL"],
    soft: ["Problem Solving", "Adaptability", "Team Collaboration"],
    transferable: ["Project Management", "Agile Methodologies"]
  },
  kenyan_market_alignment: {
    best_skill_area_expertise: "Full-Stack Web Development",
    description: "Your stack aligns perfectly with the high demand in Nairobi's tech hubs.",
    service_potentiality_score: 85,
    market_readiness_score: 78,
    skill_scarcity_index: "Medium"
  },
  sector_demand: [
    { sector: "FinTech", demand_percentage: 88 },
    { sector: "E-Commerce", demand_percentage: 75 }
  ],
  recommended_role: { title: "Junior Full-Stack Developer", description: "Building responsive frontend interfaces." },
  marketable_services: [
    { service_name: "Custom Web Application Development", demand_score: 92, description: "Developing custom dashboards." }
  ]
};

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [view, setView] = useState('landing');
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // ✅ FIX: Added the missing auth syncing state
  const [isAuthSyncing, setIsAuthSyncing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (userRole === 'GUEST') return; 

      setUser(currentUser);
      if (currentUser) {
        setIsAuthSyncing(true); // Start spinner
        try {
          const token = await currentUser.getIdToken();
          const response = await axios.post(`${API_BASE_URL}/api/sync-user`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const role = response.data.role;
          setUserRole(role);

          if (role === 'SUPER_ADMIN') setView('dev_dashboard');
          else if (role === 'UNIVERSITY_ADMIN') setView('admin_dashboard');
          else if (role === 'GOVT_ADMIN') setView('govt_dashboard'); 
          else setView('onboarding'); 

        } catch (error) {
          // ✅ FIX: Actually handle the error instead of silently failing
          console.error("Failed to fetch user role.", error);
          toast.error("Failed to connect to the server. Please try again.");
          await signOut(auth); // Safely log them out
          setView('landing');
        } finally {
          setIsAuthSyncing(false); // Stop spinner
        }
      } else {
        setView('landing');
        setUserRole(null);
        setIsAuthSyncing(false); // Stop spinner
      }
    });
    return () => unsubscribe();
  }, [userRole]);

  const handleGuestLogin = () => {
    setUser({
      displayName: "Guest Explorer",
      email: "demo@tuk-talent.local",
      photoURL: "https://ui-avatars.com/api/?name=Guest+Explorer&background=10b981&color=fff",
      uid: "guest-123"
    });
    setUserRole('GUEST');
    setMasterProfile(MOCK_GUEST_PROFILE);
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (userRole !== 'GUEST') await signOut(auth);
    setProfile(null);
    setMasterProfile(null);
    setPortfolioData(null);
    setUserRole(null);
    setUser(null);
    setView('landing');
  };

  const requireLiveAccount = () => {
    if (userRole === 'GUEST') {
      toast.error("Sign in with Google to use live AI features!");
      setView('landing');
      return true;
    }
    return false;
  };

  const handleProcessDocuments = async (e) => {
    if (requireLiveAccount()) return;
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    
    setLoading(true);
    setView('processing');
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('documents', file));
    
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/api/analyze-data`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setView('dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || "Error analyzing documents.");
      setView('onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMasterProfile = async () => {
    if (requireLiveAccount()) return;
    setIsSynthesizing(true);
    setView('processing'); 
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/api/synthesize-profile`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMasterProfile(response.data);
      toast.success("Master Profile generated!");
      setView('dashboard'); 
    } catch (error) {
      toast.error("Could not generate Master Profile. Make sure you have uploaded at least 2 documents.");
      setView('dashboard');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePreparePortfolio = async (service) => {
    if (requireLiveAccount()) return;
    setView('processing'); 
    try {
        const token = await user.getIdToken();
        const response = await axios.post(`${API_BASE_URL}/api/generate-portfolio`, {
            masterProfile,
            serviceName: service.service_name,
            serviceDescription: service.description
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setPortfolioData(response.data);
        setView('module_portfolio');
    } catch (e) {
        toast.error("Failed to generate portfolio.");
        setView('module_services');
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

  const isGuest = userRole === 'GUEST';

  // ✅ FIX: Render a loading screen while waiting for the backend
  if (isAuthSyncing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Connecting securely...</h2>
          <p className="text-slate-500 max-w-sm text-center">
            Synchronizing with the TU-K database. (This may take up to 40 seconds on the first load).
          </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />
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
        {view === 'landing' && <LandingView onLogin={() => signInWithPopup(auth, googleProvider)} onGuestLogin={handleGuestLogin} />}
        
        {view === 'onboarding' && (
          <OnboardingView user={user} onFileChange={handleProcessDocuments} isUploading={loading} onSkip={() => setView('dashboard')} isGuest={isGuest} />
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
          <DashboardView user={user} profile={profile} masterProfile={masterProfile} onDownload={() => downloadPDF('master-dashboard-export')} onGenerateMaster={handleGenerateMasterProfile} isSynthesizing={isSynthesizing} isGuest={isGuest} />
        )}
        
        {view === 'admin_dashboard' && <AdminDashboardView />}
        {view === 'dev_dashboard' && <div className="p-8 bg-white rounded-3xl shadow-xl"><h2>Developer Super-Panel</h2></div>}
        {view === 'settings' && <ProfileSettings user={user} isAdmin={userRole === 'SUPER_ADMIN'} />}

        {view === 'module_skills' && <SkillsModuleView masterProfile={masterProfile} />}
        {view === 'module_market' && <MarketModuleView masterProfile={masterProfile} />}
        {view === 'module_services' && <ServicesModuleView masterProfile={masterProfile} onPrepare={handlePreparePortfolio} />}
        {view === 'module_portfolio' && <PortfolioView portfolioData={portfolioData} onBack={() => setView('module_services')} onDownload={() => downloadPDF('portfolio-export')} />}
      </main>
    </div>
  );
}

export default App;