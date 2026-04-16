// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

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

// --- MOCK DATA FOR GUEST MODE ---
const MOCK_GUEST_PROFILE = {
  bio: "A highly motivated aspiring tech professional with a strong foundation in scalable software development and data analysis. Seeking to leverage my technical skills to build solutions within the Kenyan tech ecosystem.",
  skills: {
    technical: ["JavaScript", "React.js", "Node.js", "Python", "SQL", "Git/GitHub", "Tailwind CSS"],
    soft: ["Problem Solving", "Adaptability", "Team Collaboration", "Critical Thinking"],
    transferable: ["Project Management", "Agile Methodologies", "Technical Writing"]
  },
  kenyan_market_alignment: {
    best_skill_area_expertise: "Full-Stack Web Development",
    description: "Your stack aligns perfectly with the high demand in Nairobi's tech hubs (Westlands, Kilimani) where startups and established firms like Safaricom are aggressively digitizing their operations.",
    service_potentiality_score: 85,
    market_readiness_score: 78,
    skill_scarcity_index: "Medium"
  },
  sector_demand: [
    { sector: "FinTech", demand_percentage: 88 },
    { sector: "E-Commerce", demand_percentage: 75 },
    { sector: "AgriTech", demand_percentage: 65 },
    { sector: "NGO / HealthTech", demand_percentage: 70 }
  ],
  recommended_role: {
    title: "Junior Full-Stack Developer",
    description: "Building responsive frontend interfaces and secure backend APIs for Kenyan consumers."
  },
  marketable_services: [
    {
      service_name: "Custom Web Application Development",
      demand_score: 92,
      description: "Developing custom dashboards and web solutions for Kenyan SMEs transitioning online."
    },
    {
      service_name: "API Integration Services",
      demand_score: 85,
      description: "Integrating local gateways like M-Pesa Daraja API into existing business applications."
    }
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
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (userRole === 'GUEST') return; 

      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const response = await axios.post('http://localhost:5000/api/sync-user', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const role = response.data.role;
          setUserRole(role);

          if (role === 'SUPER_ADMIN') setView('dev_dashboard');
          else if (role === 'UNIVERSITY_ADMIN') setView('admin_dashboard');
          else if (role === 'GOVT_ADMIN') setView('govt_dashboard'); 
          else setView('onboarding'); 
        } catch (error) {
          console.error("Failed to fetch user role.");
        }
      } else {
        setView('landing');
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, [userRole]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (e) { console.error("Login Error", e); }
  };

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
    if (userRole !== 'GUEST') {
      await signOut(auth);
    }
    setProfile(null);
    setMasterProfile(null);
    setPortfolioData(null);
    setUserRole(null);
    setUser(null);
    setView('landing');
  };

  const requireLiveAccount = () => {
    if (userRole === 'GUEST') {
      alert("Sign in with your Google account to upload your own CV and unlock live AI analysis!");
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
      const response = await axios.post('http://localhost:5000/api/analyze-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setView('dashboard');
    } catch (error) {
      alert("Error analyzing documents.");
      setView('onboarding');
    }
    setLoading(false);
  };

  const handleGenerateMasterProfile = async () => {
    if (requireLiveAccount()) return;

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
      alert("Could not generate Master Profile. Make sure you have uploaded at least 2 documents in the past.");
      setView('dashboard');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePreparePortfolio = async (service) => {
    if (requireLiveAccount()) return;

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

  const isGuest = userRole === 'GUEST';

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
        {view === 'landing' && <LandingView onLogin={handleLogin} onGuestLogin={handleGuestLogin} />}
        
        {view === 'onboarding' && (
          <OnboardingView 
            user={user} 
            onFileChange={handleProcessDocuments} 
            isUploading={loading} 
            onSkip={() => setView('dashboard')}
            isGuest={isGuest}
          />
        )}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
             <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <h3 className="text-2xl font-bold text-slate-900">
                {isSynthesizing ? 'Synthesizing Master Profile...' : isGeneratingPortfolio ? 'Crafting Portfolio Blueprint...' : 'AI is mapping your potential...'}
             </h3>
          </div>
        )}

        {view === 'dashboard' && (
          <DashboardView 
            user={user} 
            profile={profile} 
            masterProfile={masterProfile} 
            onDownload={() => downloadPDF('master-dashboard-export')}
            onGenerateMaster={handleGenerateMasterProfile}
            isSynthesizing={isSynthesizing} 
            isGuest={isGuest}
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
