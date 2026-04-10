import React from 'react';
import SkillList from './SkillList';
import { AlertCircle, Download, Briefcase, TrendingUp } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardView({ user, profile, masterProfile, onDownload }) {
  const activeProfile = masterProfile || profile;

  // Data for the radar chart
  const radarData = (activeProfile?.skills?.technical || []).slice(0, 6).map((skill) => ({
    subject: skill.length > 10 ? skill.substring(0, 10) + '...' : skill,
    A: 75 + (Math.random() * 20),
    fullMark: 100,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500" id="master-dashboard-export">
      
      {/* ONBOARDING ALERT */}
      {!masterProfile && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium">Generate your <b>Master Profile</b> by uploading more documents to unlock full sector analysis.</p>
          </div>
        </div>
      )}

      {/* HEADER & EXPORT */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={user?.photoURL} 
            alt="Profile" 
            crossOrigin="anonymous" 
            className="w-16 h-16 rounded-full border-4 border-emerald-50 shadow-sm" 
          />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user?.displayName}</h2>
            <p className="text-emerald-600 font-semibold">{activeProfile?.recommended_role?.title || 'Analysing Role...'}</p>
          </div>
        </div>
        <button 
          onClick={onDownload} 
          className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-bold text-sm shadow-md"
        >
          <Download className="w-4 h-4" /> Export Professional PDF
        </button>
      </div>

      {/* CSS GRID: MASTER LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Bio & Skills */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase">
               Professional Bio
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">{activeProfile?.bio}</p>
          </div>
          
          <SkillList title="Technical Expertise" skills={activeProfile?.skills?.technical} />
          <SkillList title="Core Soft Skills" skills={activeProfile?.skills?.soft} />
        </div>

        {/* Right Column: Market Analysis & Stats */}
        <div className="md:col-span-2 space-y-6">
          
          {/* KENYAN MARKET ALIGNMENT MODULE */}
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Briefcase className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Market Focus</h3>
                    <p className="text-2xl font-extrabold">{activeProfile?.kenyan_market_alignment?.best_skill_area_expertise}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Potentiality Score</p>
                    <p className="text-4xl font-black text-emerald-400">{activeProfile?.kenyan_market_alignment?.service_potentiality_score}%</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                  <p className="text-slate-200 text-sm leading-relaxed italic">"{activeProfile?.kenyan_market_alignment?.description}"</p>
                </div>
            </div>
          </div>

          {/* STATISTICS DASHBOARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase">
               <TrendingUp className="w-4 h-4 text-emerald-500" /> Skill Competency Mapping
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Proficiency"
                      dataKey="A"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
