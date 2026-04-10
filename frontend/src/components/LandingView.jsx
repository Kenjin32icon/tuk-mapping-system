import React, { useState } from 'react';

export default function LandingView({ onLogin }) {
  const [loginRole, setLoginRole] = useState('student');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <h1 className="text-4xl font-bold text-tukBlue mb-6">TU-K Talent Portal</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Role</label>
        <select 
          className="w-full border p-2 rounded mb-6 bg-slate-50"
          value={loginRole}
          onChange={(e) => setLoginRole(e.target.value)}
        >
          <option value="student">Student / Graduate</option>
          <option value="admin">TU-K Administrator</option>
        </select>

        <button 
          onClick={() => onLogin(loginRole)}
          className="w-full bg-tukAccent text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
