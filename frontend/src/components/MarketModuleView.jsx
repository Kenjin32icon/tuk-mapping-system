import React from 'react';
import { TrendingUp, MapPin, Target } from 'lucide-react';

export default function MarketModuleView({ masterProfile }) {
  if (!masterProfile) return null;

  const market = masterProfile?.kenyan_market_alignment;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <MapPin className="w-8 h-8 text-emerald-200" /> Kenyan Market Alignment
          </h2>
          <p className="text-emerald-100">Mapping your expertise to Nairobi tech hubs, local startups, and corporate demands.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 text-center min-w-[200px]">
          <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider mb-1">Service Potentiality</p>
          <p className="text-5xl font-black text-white">{market?.service_potentiality_score || 0}%</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-emerald-500" /> Optimal Skill Area Expertise
        </h3>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
          <p className="text-2xl font-black text-slate-800 mb-2">{market?.best_skill_area_expertise || 'Pending Analysis'}</p>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-500" /> Sector Fitting & Demand
        </h3>
        <p className="text-slate-600 leading-relaxed text-lg bg-blue-50/50 p-6 rounded-2xl border border-blue-50">
          {market?.description || 'Your profile does not currently have enough data to generate a comprehensive sector fit. Upload more coursework to refine this analysis.'}
        </p>
      </div>

    </div>
  );
}
