import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
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
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- MOCK DATA FOR GUEST MODE ---
const MOCK_GUEST_PROFILE = {
  bio: "A highly motivated aspiring tech professional with a strong foundation in software development. Testing system capabilities in Guest Mode.",
  skills: {
    technical: ["JavaScript", "React.js", "Node.js", "Python", "SQL"],
    soft: ["Problem Solving", "Adaptability", "Team Collaboration"],
    transferable: ["Project Management", "Agile Methodologies"]
  },
  kenyan_market_alignment: {
    market_readiness_score: 85,
    best_skill_area_expertise: "Full-Stack Development"
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [view, setView] = useState('landing');
  const [masterProfile, setMasterProfile] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isAuthSyncing, setIsAuthSyncing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isGuest) {
        setIsAuthSyncing(false);
        return;
      }

      setUser(currentUser);
      
      if (currentUser) {
        setIsAuthSyncing(true); 
        try {
          const token = await currentUser.getIdToken();
          
          const response = await axios.post(`${API_BASE_URL}/api/sync-user`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const { role, masterProfile: existingProfile } = response.data;
          setUserRole(role);
          setMasterProfile(existingProfile);

          if (role === 'SUPER_ADMIN') {
            setView('dev_dashboard');
          } else if (role === 'UNIVERSITY_ADMIN') {
            setView('admin_dashboard');
          } else if (role === 'GOVT_ADMIN') {
            setView('govt_dashboard');
          } else {
            setView(existingProfile ? 'dashboard' : 'onboarding');
          }

        } catch (error) {
          console.error("Failed to sync user role with backend.", error);
          toast.error("Connection timeout. Please refresh or try again in a moment.");
          setView('landing'); 
        } finally {
          setIsAuthSyncing(false); 
        }
      } else {
        setView('landing');
        setUserRole(null);
        setIsAuthSyncing(false);
      }
    });
    return () => unsubscribe();
  }, [isGuest]);

  const handleLogout = () => {
    signOut(auth);
    setIsGuest(false);
    setUserRole(null);
    setMasterProfile(null);
    setView('landing');
  };

  const enterGuestMode = () => {
    setIsGuest(true);
    setUser({ displayName: "Guest Student", email: "guest@tuk.ac.ke" });
    setUserRole('STUDENT');
    setMasterProfile(MOCK_GUEST_PROFILE);
    setView('dashboard');
  };

  const handleGenerateMasterProfile = async () => {
    if (!user) {
        return toast.error("Please sign in with Google to use AI synthesis.");
    }

    setIsSynthesizing(true);
    setView('processing'); 
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/api/synthesize-profile`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMasterProfile(response.data);
      
      toast.success("Master Profile generated successfully!"); 
      setView('dashboard'); 
    } catch (error) {
      toast.error("Could not generate Master Profile. Ensure you have 2+ documents uploaded."); 
      setView('dashboard');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePreparePortfolio = async (service) => {
    if (isGuest) return toast.error("Sign in to generate targeted portfolios.");
    setIsGeneratingPortfolio(true);
    setView('processing');
    try {
      const token = await user.getIdToken();
      const res = await axios.post(`${API_BASE_URL}/api/generate-portfolio`, {
        masterProfile,
        serviceName: service.service_name,
        serviceDescription: service.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolioData(res.data);
      setView('module_portfolio');
    } catch (err) {
      toast.error("Failed to generate blueprint.");
      setView('module_services');
    } finally {
      setIsGeneratingPortfolio(false);
    }
  };

  const downloadPDF = (elementId) => {
    const element = document.getElementById(elementId);
    const opt = {
      margin: 10,
      filename: `TUK-Career-Asset-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  if (isAuthSyncing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Waking up the AI...</h2>
          <p className="text-slate-500 max-w-sm">
            Securely connecting to the TU-K database. This might take up to 40 seconds on the first load while the server spins up.
          </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-center" />
      
      <Navbar 
        user={user} 
        userRole={userRole}
        view={view} 
        setView={setView} 
        handleLogout={handleLogout}
        masterProfile={masterProfile}
        onGenerateMaster={handleGenerateMasterProfile}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {view === 'landing' && <LandingView onGuestLogin={enterGuestMode} />}
        
        {view === 'onboarding' && (
          <OnboardingView 
            user={user} 
            onFileChange={() => toast.success("File uploaded to queue.")} 
            isUploading={loading} 
            onSkip={() => setView('dashboard')}
          />
        )}

        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
             <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <h3 className="text-2xl font-bold text-slate-800">
                {isSynthesizing ? 'Synthesizing Master Profile...' : 'AI is mapping your potential...'}
             </h3>
          </div>
        )}

        {view === 'dashboard' && (
          <DashboardView 
            user={user} 
            masterProfile={masterProfile} 
            onDownload={() => downloadPDF('master-dashboard-export')}
            onGenerateMaster={handleGenerateMasterProfile}
            isSynthesizing={isSynthesizing} 
            isGuest={isGuest}
          />
        )}
        
        {view === 'admin_dashboard' && <AdminDashboardView />}
        {view === 'dev_dashboard' && (
          <div className="p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold mb-4">Developer Super-Panel</h2>
            <p className="text-slate-600">Full system oversight and analytics access granted.</p>
          </div>
        )}

        {view === 'settings' && <ProfileSettings user={user} isAdmin={userRole === 'SUPER_ADMIN'} />}

        {/* Module Routing */}
        {view === 'module_skills' && <SkillsModuleView masterProfile={masterProfile} />}
        {view === 'module_market' && <MarketModuleView masterProfile={masterProfile} />}
        {view === 'module_services' && <ServicesModuleView masterProfile={masterProfile} onPrepare={handlePreparePortfolio} />}
        {view === 'module_portfolio' && <PortfolioView portfolioData={portfolioData} onBack={() => setView('module_services')} onDownload={() => downloadPDF('portfolio-export')} />}
      </main>
    </div>
  );
}

export default App;