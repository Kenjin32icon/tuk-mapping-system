// components/LandingView.jsx
import React, { useState } from 'react';
import { BrainCircuit, FileText, Target, CheckCircle } from 'lucide-react';

export default function LandingView({ onLogin, onGuestLogin }) {
  const [loginRole, setLoginRole] = useState('student');

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-[85vh] max-w-6xl mx-auto px-6 gap-12 animate-in fade-in duration-700">
      
      {/* Left Column: Explanatory Detail & Value Proposition */}
      <div className="md:w-1/2 space-y-8">
        <div className="flex items-center gap-4">
          <img src="/tuk-skills-map-logo.png" alt="TUK Logo" className="w-16 h-16 object-contain rounded-xl shadow-sm" />
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">TU-K Talent Portal</h1>
            <p className="text-emerald-600 font-bold tracking-wide uppercase text-sm">Powered by AI</p>
          </div>
        </div>

        <p className="text-lg text-slate-600 leading-relaxed">
          Transform your university coursework into a professional career roadmap. The TU-K Talent Portal uses advanced AI to analyse your academic history and align your skills with the Kenyan job market.
        </p>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-emerald-500" /> How it Works
          </h3>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <p className="text-sm text-slate-600"><strong>Upload up to 5 Documents:</strong> Provide your CV, past semester performance transcripts, major assignments, or professional certificates.</p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <p className="text-sm text-slate-600"><strong>AI Synthesis:</strong> Our engine reads your documents to uncover your hidden technical and soft skills.</p>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-700 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <p className="text-sm text-slate-600"><strong>Generate Master Profile:</strong> Instantly receive a targeted career path, market readiness score, and a downloadable portfolio.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Login Box (Kept mostly the same from your code) */}
      <div className="md:w-5/12 w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 login-section">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Get Started</h2>
        
        <div className="text-left mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Login as:</label>
          <select 
            className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
            value={loginRole}
            onChange={(e) => setLoginRole(e.target.value)}
          >
            <option value="student">🎓 TU-K Student</option>
            <option value="admin">🛡️ Administrator</option>
          </select>
        </div>

        <button 
          onClick={onLogin} 
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-3 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1 5.16z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button 
          onClick={onGuestLogin}
          className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors border border-slate-200 guest-button"
        >
          Explore as Guest
        </button>
      </div>
    </div>
  );
}
