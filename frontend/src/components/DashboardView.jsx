import React from 'react';
import SkillList from './SkillList';
import { AlertCircle, Download, Briefcase } from 'lucide-react';

export default function DashboardView({ user, profile, masterProfile, onDownload }) {
  const activeProfile = masterProfile || profile;

  return (
    <div className="space-y-6" id="master-dashboard-export">
      
      {/* ONBOARDING ALERT */}
      {!masterProfile && (
        <div className="animate-fade-in bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-purple-600" />
            <p className="font-medium">You haven't generated your Master Profile yet! Upload more documents to unlock deep analytics.</p>
          </div>
        </div>
      )}

      {/* HEADER & EXPORT */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          {/* Ensure crossOrigin="anonymous" is here for PDF export! */}
          <img src={user?.photoURL} alt="Profile" crossOrigin="anonymous" className="w-16 h-16 rounded-full border-2 border-tukAccent" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{user?.displayName}</h2>
            <p className="text-slate-500">{activeProfile?.recommended_role?.title || 'Analysing Role...'}</p>
          </div>
        </div>
        <button onClick={onDownload} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700">
          <Download className="w-4 h-4" /> Export Profile
        </button>
      </div>

      {/* CSS GRID: MASTER LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Skills & Bio */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2">Professional Bio</h3>
            <p className="text-slate-600 text-sm">{activeProfile?.bio}</p>
          </div>
          <SkillList title="Technical Skills" skills={activeProfile?.skills?.technical} />
          <SkillList title="Soft Skills" skills={activeProfile?.skills?.soft} />
        </div>

        {/* Right Column: Market Analysis & Stats */}
        <div className="md:col-span-2 space-y-6">
          
          {/* KENYAN MARKET ALIGNMENT MODULE */}
          <div className="bg-gradient-to-br from-tukBlue to-slate-800 p-6 rounded-xl text-white shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-emerald-400">Best Skill Area Expertise</h3>
                <p className="text-2xl font-bold">{activeProfile?.kenyan_market_alignment?.best_skill_area_expertise}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Service Potentiality</p>
                <p className="text-3xl font-bold text-emerald-400">{activeProfile?.kenyan_market_alignment?.service_potentiality_score}%</p>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-lg border border-white/20 backdrop-blur-sm">
              <p className="text-sm leading-relaxed">{activeProfile?.kenyan_market_alignment?.description}</p>
            </div>
          </div>

          {/* STATISTICS DASHBOARD (Placeholder for Recharts) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-64 flex items-center justify-center">
            {/* Insert your Recharts <BarChart> or <RadarChart> here using activeProfile data */}
            <p className="text-slate-400">Statistics Dashboard renders here</p>
          </div>

        </div>
      </div>
    </div>
  );
}

