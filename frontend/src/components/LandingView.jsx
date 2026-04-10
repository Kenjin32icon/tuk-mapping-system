import React, { useState } from 'react';

export default function LandingView({ onLogin }) {
  const [loginRole, setLoginRole] = useState('student');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">TU-K Talent Portal</h1>
        <p className="text-slate-500 mb-8 text-sm">Empowering students through AI-driven market mapping.</p>
        
        <div className="text-left mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Login as:</label>
          <select 
            className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 focus:border-emerald-500 outline-none transition-all"
            value={loginRole}
            onChange={(e) => setLoginRole(e.target.value)}
          >
            <option value="student">Student / Graduate</option>
            <option value="admin">TU-K Administrator</option>
          </select>
        </div>

        <button 
          onClick={() => onLogin(loginRole)}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
