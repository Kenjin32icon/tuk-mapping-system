// App.jsx
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
import PortfolioView from './components/PortfolioView';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [view, setView] = useState('landing');
  const [profile, setProfile] = useState(null);
  const [masterProfile, setMasterProfile] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const response = await axios.post('http://localhost:5000/api/sync-user', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const role = response.data.role;
          setUserRole(role);

          // Route them based on their database role
          if (role === 'SUPER_ADMIN') setView('dev_dashboard');
          else if (role === 'UNIVERSITY_ADMIN') setView('admin_dashboard');
          else if (role === 'GOVT_ADMIN') setView('govt_dashboard');
          else setView('dashboard'); 

        } catch (error) {
          console.error("Failed to fetch user role.");
          setView('landing');
        }
      } else {
        setView('landing');
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handlers ... (handleLogin, handleLogout, handlePreparePortfolio, etc.)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar 
        user={user} 
        userRole={userRole} 
        view={view} 
        setView={setView} 
        handleLogout={handleLogout} 
        masterProfile={masterProfile}
      />

      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        {view === 'landing' && <LandingView onLogin={handleLogin} />}
        {view === 'onboarding' && <OnboardingView user={user} onFileChange={handleProcessDocuments} isUploading={loading} onSkip={() => setView('dashboard')}/>}
        
        {view === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
             <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <h3 className="text-2xl font-bold">Synchronizing Identity...</h3>
          </div>
        )}

        {/* Dynamic Role Views */}
        {view === 'dashboard' && <DashboardView user={user} masterProfile={masterProfile} />}
        {view === 'admin_dashboard' && <AdminDashboardView />}
        {view === 'dev_dashboard' && <div className="p-8 bg-white rounded-3xl shadow-xl"><h2>Developer Super-Panel</h2></div>}
        
        {/* Module Routing */}
        {view === 'module_skills' && <SkillsModuleView masterProfile={masterProfile} />}
        {view === 'module_market' && <MarketModuleView masterProfile={masterProfile} /> }
        {view === 'module_services' && <ServicesModuleView masterProfile={masterProfile} onPrepare={handlePreparePortfolio} />}
        {view === 'module_portfolio' && <PortfolioView portfolioData={portfolioData} onBack={() => setView('module_services')} />}
      </main>
    </div>
  );
}
export default App;
