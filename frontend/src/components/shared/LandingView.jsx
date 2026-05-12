// components/LandingView.jsx
import React, { useState } from 'react';
import { BrainCircuit, UploadCloud, Layers, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

export default function LandingView({ onLogin, onGuestLogin }) {
  const [loginRole, setLoginRole] = useState('student');

  return (
    <div className="flex flex-col md:flex-row items-start justify-center min-h-[85vh] max-w-6xl mx-auto px-6 gap-10 animate-in fade-in duration-700 pt-6">

      {/* ── LEFT COLUMN ───────────────────────────────────────────────────── */}
      <div className="md:w-1/2 space-y-6">
        {/* Branding */}
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

        {/* ── DOCUMENT UPLOAD REQUIREMENT NOTICE ─────────────────────────── */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-base">Document Upload is Required</h3>
              <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                To fully use this system, you <strong>must upload at least 2 documents</strong> — your CV, academic transcripts, project reports, or professional certificates. Without them, the AI cannot generate your career analysis.
              </p>
            </div>
          </div>

          {/* Steps to full access */}
          <div className="space-y-2">
            {[
              { icon: UploadCloud, text: 'Upload 2–5 documents (CV, transcripts, certificates)', req: true },
              { icon: BrainCircuit, text: 'Generate your AI Master Profile for skills & market analysis', req: true },
              { icon: Layers, text: 'Access Services, Portfolio Builder, and Market Modules', req: false },
            ].map(({ icon: Icon, text, req }, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${req ? 'bg-amber-100' : 'bg-emerald-50'}`}>
                  <Icon className={`w-4 h-4 ${req ? 'text-amber-600' : 'text-emerald-500'}`} />
                </div>
                <p className="text-sm text-slate-700 font-medium flex-1">{text}</p>
                {!req && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                {req && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Required</span>}
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-emerald-500" /> How it Works
          </h3>

          {[
            {
              step: '1',
              title: 'Upload up to 5 Documents',
              body: 'Provide your CV, past semester performance transcripts, major assignments, or professional certificates. The more you upload, the richer your profile.'
            },
            {
              step: '2',
              title: 'AI Synthesis',
              body: 'Our engine reads your documents to uncover your hidden technical and soft skills and map them against live Kenyan market demand data.'
            },
            {
              step: '3',
              title: 'Generate Your Master Profile',
              body: 'Receive a targeted career path, market readiness score, sector demand analysis, and a downloadable AI portfolio — all from your own documents.'
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">{step}</div>
              <p className="text-sm text-slate-600"><strong>{title}:</strong> {body}</p>
            </div>
          ))}
        </div>

        {/* Features unlocked after profile */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Unlocked after Master Profile generation</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              '📊 Skills Analysis',
              '🇰🇪 Kenyan Market Alignment',
              '💼 Service Recommendations',
              '📁 Portfolio Builder',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
                <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: LOGIN ─────────────────────────────────────────────── */}
      <div className="md:w-5/12 w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 login-section sticky top-8">
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
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 font-medium">or</span></div>
        </div>

        <button
          onClick={onGuestLogin}
          className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors border border-slate-200 guest-button"
        >
          Explore as Guest
        </button>

        <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
          Guest mode shows a demo profile with sample data. Sign in with Google to process your own documents and generate your real career profile.
        </p>

        {/* Quick-access reminder inside the login box */}
        <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">After signing in, you'll need to:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <UploadCloud className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              Upload your documents (CV, transcripts, etc.)
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              Generate your AI Master Profile
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Layers className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              Explore Skills, Market & Services modules
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}