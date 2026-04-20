// components/Navbar.jsx
import React, { useState } from 'react';
import { Menu, X, UploadCloud, LayoutDashboard, Settings, LogOut, Shield, BrainCircuit } from 'lucide-react';

export default function Navbar({ user, userRole, view, setView, handleLogout, masterProfile, onGenerateMaster }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const navigate = (targetView) => {
    setView(targetView);
    setMenuOpen(false);
  };

  const isAnyAdmin = userRole === 'SUPER_ADMIN' || userRole === 'UNIVERSITY_ADMIN' || userRole === 'GOVT_ADMIN';

  return (
    <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-6xl flex justify-between items-center">
        
        {/* Branding */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(isAnyAdmin ? 'admin_dashboard' : 'dashboard')}>
          <a href="/" className="flex items-center gap-3">
  <img src="/tuk-skills-map-logo.png" alt="TUK Skills Map Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
  <div className="hidden sm:block">
    <p className="text-xs ...">TUK Skills Map</p>
    <h1 className="text-xl ...">Talent Portal</h1>
  </div>
</a>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.24em]">TUK Skills Map</p>
            <h1 className="text-xl font-bold text-slate-800">
              {isAnyAdmin ? 'Admin Portal' : 'Talent Portal'}
            </h1>
          </div>
        </div>

        {/* User Info & Toggle */}
        <div className="flex items-center gap-4 relative">
          <span className="text-sm font-medium text-slate-600 hidden sm:block">
            {user.displayName}
          </span>
          <img src={user.photoURL} alt="Profile" crossOrigin="anonymous" className="w-10 h-10 rounded-full border-2 border-emerald-600 shadow-sm" />
          
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
            {menuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>

          {/* DROPDOWN MENU */}
          {menuOpen && (
            <div className="absolute top-14 right-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* ADVANCED ADMIN LINKS */}
              {userRole === 'SUPER_ADMIN' && (
                <button onClick={() => navigate('dev_dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Shield className="w-4 h-4 text-purple-600"/> Developer Panel
                </button>
              )}
              
              {(userRole === 'UNIVERSITY_ADMIN' || userRole === 'SUPER_ADMIN') && (
                <button onClick={() => navigate('admin_dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                  <LayoutDashboard className="w-4 h-4 text-emerald-600"/> TU-K Control Center
                </button>
              )}

              {/* STUDENT LINKS */}
              {userRole === 'STUDENT' && (
                <>
                  <button onClick={() => navigate('dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                    <LayoutDashboard className="w-4 h-4 text-emerald-600"/> Main Dashboard
                  </button>
                  <button onClick={() => navigate('onboarding')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                    <UploadCloud className="w-4 h-4 text-emerald-500"/> Upload Documents
                  </button>
                  
                  <hr className="my-1 border-slate-100" />
                  
                  {/* DYNAMIC MASTER PROFILE / MODULE LINKS */}
                  {masterProfile ? (
                    <div className="bg-slate-50 py-1">
                       <p className="px-4 py-1 text-xs font-bold text-slate-400 uppercase">Master Modules</p>
                       <button onClick={() => navigate('module_skills')} className="w-full text-left px-4 py-2 hover:bg-emerald-100 flex items-center gap-3 text-sm font-medium text-slate-700">
                         Skills Analysis
                       </button>
                       <button onClick={() => navigate('module_market')} className="w-full text-left px-4 py-2 hover:bg-emerald-100 flex items-center gap-3 text-sm font-medium text-slate-700">
                         Market Alignment
                       </button>
                       <button onClick={() => navigate('module_services')} className="w-full text-left px-4 py-2 hover:bg-emerald-100 flex items-center gap-3 text-sm font-medium text-slate-700">
                         Recommended Services
                       </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setMenuOpen(false); onGenerateMaster(); }} 
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 text-sm font-bold text-purple-700"
                    >
                      <BrainCircuit className="w-4 h-4"/> Generate Master Profile
                    </button>
                  )}
                </>
              )}

              {/* SHARED LINKS (Settings & Logout) */}
              <hr className="my-1 border-slate-100" />
              <button onClick={() => navigate('settings')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                <Settings className="w-4 h-4 text-slate-400"/> Profile Settings
              </button>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-sm font-medium text-red-600">
                <LogOut className="w-4 h-4"/> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
