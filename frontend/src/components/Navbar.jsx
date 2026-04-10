import React, { useState } from 'react';
import { Menu, X, UploadCloud, LayoutDashboard, Settings, LogOut, Shield } from 'lucide-react';

export default function Navbar({ user, isAdmin, view, setView, handleLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const navigate = (targetView) => {
    setView(targetView);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-6xl flex justify-between items-center">
        
        {/* Branding */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(isAdmin ? 'admin_dashboard' : 'dashboard')}>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
            TU
          </div>
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
            {isAdmin ? 'Admin Portal' : 'Talent Portal'}
          </h1>
        </div>

        {/* User Info & Toggle */}
        <div className="flex items-center gap-4 relative">
          <span className="text-sm font-medium text-slate-600 hidden sm:block">
            {user.displayName}
          </span>
          <img 
            src={user.photoURL} 
            alt="Profile" 
            crossOrigin="anonymous" 
            className="w-10 h-10 rounded-full border-2 border-emerald-500" 
          />
          
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
            {menuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>

          {menuOpen && (
            <div className="absolute top-14 right-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {isAdmin ? (
                <button onClick={() => navigate('admin_dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-600"/> Control Center
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                    <LayoutDashboard className="w-4 h-4 text-emerald-600"/> Dashboard
                  </button>
                  <button onClick={() => navigate('onboarding')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700">
                    <UploadCloud className="w-4 h-4 text-emerald-500"/> Upload Documents
                  </button>
                </>
              )}

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
