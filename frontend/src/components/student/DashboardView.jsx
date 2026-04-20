import React from 'react';
import SkillList from '../shared/SkillList'; // ⬅️ UPDATED PATH
import { Download, BrainCircuit, TrendingUp, Target, Activity, Info } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

// Add this helper component at the top of DashboardView.jsx (outside the main export function)
const AffiliateCard = ({ roleTitle }) => {
  // Simple logic to match gear to the AI's recommended role
  let gear = { category: "Productivity", item: "High-Performance Laptops", link: "YOUR_JUMIA_GENERAL_LINK_HERE" };
  
  if (roleTitle && roleTitle.toLowerCase().includes('software') || roleTitle.toLowerCase().includes('developer')) {
    gear = { category: "Coding", item: "External Monitors & Mechanical Keyboards", link: "YOUR_JUMIA_MONITOR_LINK_HERE" };
  } else if (roleTitle && roleTitle.toLowerCase().includes('design') || roleTitle.toLowerCase().includes('creative')) {
    gear = { category: "Creative", item: "Graphics Tablets & Color-Accurate Displays", link: "YOUR_JUMIA_TABLET_LINK_HERE" };
  }

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-3xl shadow-lg text-white mt-8 flex flex-col md:flex-row items-center justify-between">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-200" /> 
          Essential Gear for {roleTitle || "Your Career"}
        </h3>
        <p className="text-emerald-100 text-sm mt-1 max-w-md">
          To succeed as a top-tier professional in this sector, having the right setup is crucial. Upgrade your {gear.category} setup with the best student deals.
        </p>
      </div>
      <a 
        href={gear.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-4 md:mt-0 px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-sm text-sm"
      >
        Shop {gear.item}
      </a>
    </div>
  );
};

export default function DashboardView({ user, profile, masterProfile, onDownload, onGenerateMaster, isSynthesizing, isGuest }) {
  const activeProfile = masterProfile || profile;

  const radarData = (activeProfile?.skills?.technical || []).slice(0, 6).map((skill) => ({
    subject: skill.length > 12 ? skill.substring(0, 12) + '...' : skill,
    A: 60 + (Math.random() * 35),
    fullMark: 100,
  }));

  const sectorData = activeProfile?.sector_demand || [
    { sector: "General Tech", demand_percentage: 50 }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto" id="master-dashboard-export">
      
      {/* GUEST MODE BANNER */}
      {isGuest && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <p className="text-sm font-medium">
              <b>Interactive Demo Mode:</b> You are viewing sample AI data. Sign in with Google to upload your real CV and generate your own Master Profile.
            </p>
          </div>
        </div>
      )}

      {/* 1. PERSISTENT MASTER PROFILE ACTION BAR */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-emerald-500 overflow-hidden">
            <img src={user?.photoURL} alt="Profile" crossOrigin="anonymous" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.displayName}</h2>
            <p className="text-emerald-400 font-medium">{activeProfile?.recommended_role?.title || 'Profile Under Analysis'}</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={onGenerateMaster}
            disabled={isSynthesizing}
            className="flex-1 md:flex-none px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <BrainCircuit className="w-5 h-5" /> 
            {isSynthesizing ? 'Synthesizing...' : (masterProfile ? 'Update Master Profile' : 'Generate Master Profile')}
          </button>
          
          <button onClick={onDownload} className="p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. BIO & NARRATIVE MODULE */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider text-sm flex items-center gap-2">
           <Activity className="w-5 h-5 text-blue-500"/> Professional Summary
        </h3>
        <p className="text-slate-600 text-lg leading-relaxed">{activeProfile?.bio || "Upload more documents to generate a bio."}</p>
      </div>

      {/* 3. VISUALIZATION MODULE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-80 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase">
             <Target className="w-4 h-4 text-emerald-500" /> Competency Spread
          </h3>
          <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <Radar name="Proficiency" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-80 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase">
             <TrendingUp className="w-4 h-4 text-blue-500" /> Kenyan Sector Demand
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="sector" type="category" tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="demand_percentage" radius={[0, 8, 8, 0]} barSize={24}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. VERTICAL SKILLS MODULE */}
      <div className="space-y-6">
        <SkillList title="Core Technical Expertise" skills={activeProfile?.skills?.technical} />
        <SkillList title="Essential Soft Skills" skills={activeProfile?.skills?.soft} />
      </div>

      {/* 5. AFFILIATE MARKETING MODULE (NEW) */}
      {!isGuest && (
        <AffiliateCard roleTitle={activeProfile?.recommended_role?.title} />
      )}

    </div>
  );
}