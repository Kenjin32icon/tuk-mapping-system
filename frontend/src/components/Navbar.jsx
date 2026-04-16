// Navbar.jsx
import React, { useState } from 'react';
import { Menu, X, UploadCloud, LayoutDashboard, Settings, LogOut, Shield } from 'lucide-react';

export default function Navbar({ user, userRole, view, setView, handleLogout, masterProfile }) {
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
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(isAnyAdmin ? 'admin_dashboard' : 'dashboard')}>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">TU</div>
          <h1 className="text-xl font-bold text-slate-800">
            {isAnyAdmin ? 'Admin Portal' : 'Talent Portal'}
          </h1>
        </div>

        <div className="flex items-center gap-4 relative">
          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-emerald-500" />
          <button onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>

          {menuOpen && (
            <div className="absolute top-14 right-0 w-56 bg-white border shadow-xl rounded-xl py-2">
              {/* ADVANCED ADMIN LINKS */}
              {userRole === 'SUPER_ADMIN' && (
                <button onClick={() => navigate('dev_dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium">
                  <Shield className="w-4 h-4 text-purple-600"/> Developer Panel
                </button>
              )}
              
              {(userRole === 'UNIVERSITY_ADMIN' || userRole === 'SUPER_ADMIN') && (
                <button onClick={() => navigate('admin_dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4 text-emerald-600"/> TU-K Control Center
                </button>
              )}

              {/* STUDENT LINKS */}
              {userRole === 'STUDENT' && (
                <>
                  <button onClick={() => navigate('dashboard')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium">
                    <LayoutDashboard className="w-4 h-4 text-emerald-600"/> Main Dashboard
                  </button>
                  {/* ... dynamic master module links ... */}
                </>
              )}
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-600"><LogOut className="w-4 h-4"/> Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
