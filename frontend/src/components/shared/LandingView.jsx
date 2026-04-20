// components/LandingView.jsx
import React, { useState } from 'react';
import { Eye } from 'lucide-react';

export default function LandingView({ onLogin, onGuestLogin }) {
  const [loginRole, setLoginRole] = useState('student');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-lg bg-slate-50 flex items-center justify-center">
          <a href="/" className="flex items-center gap-3">
  <img src="/tuk-skills-map-logo.png" alt="TUK Skills Map Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
  <div className="hidden sm:block">
    <p className="text-xs ...">TUK Skills Map</p>
    <h1 className="text-xl ...">Talent Portal</h1>
  </div>
</a>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">TUK-K Skills Map</h1>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">Empowering students through AI-driven market mapping and portfolio generation.</p>
        
        <div className="text-left mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Login as:</label>
          <select 
            className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
            value={loginRole}
            onChange={(e) => setLoginRole(e.target.value)}
          >
            <option value="student">Student / Graduate</option>
            <option value="admin">TU-K Administrator</option>
          </select>
        </div>

        <button 
          onClick={() => onLogin(loginRole)}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-slate-400 font-medium">OR</span>
          </div>
        </div>

        {/* NEW DEMO BUTTON */}
        <button 
          onClick={onGuestLogin}
          className="w-full flex items-center justify-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-200 py-4 rounded-xl font-bold hover:bg-emerald-100 transition-all"
        >
          <Eye className="w-5 h-5" /> Explore Interactive Demo
        </button>

      </div>
    </div>
  );
}
