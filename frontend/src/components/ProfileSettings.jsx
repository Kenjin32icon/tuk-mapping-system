import React, { useState } from 'react';
import { User, Mail, Shield, Save } from 'lucide-react';

export default function ProfileSettings({ user, isAdmin }) {
  const [phone, setPhone] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    alert("Settings saved successfully! (Backend integration pending)");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-tukAccent" /> Account Settings
        </h2>

        {/* Read-Only Google Data */}
        <div className="flex items-center gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <img src={user?.photoURL} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-white shadow-sm" crossOrigin="anonymous"/>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{user?.displayName}</h3>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            {isAdmin && (
              <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-tukAccent/10 text-tukAccent text-xs font-bold uppercase rounded-md">
                <Shield className="w-3 h-3" /> System Administrator
              </span>
            )}
          </div>
        </div>

        {/* Editable Preferences Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000000" 
                className="w-full border border-slate-200 p-3 rounded-xl focus:border-tukAccent focus:ring-2 focus:ring-tukAccent/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Portfolio / LinkedIn URL</label>
              <input 
                type="url" 
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://linkedin.com/in/..." 
                className="w-full border border-slate-200 p-3 rounded-xl focus:border-tukAccent focus:ring-2 focus:ring-tukAccent/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
