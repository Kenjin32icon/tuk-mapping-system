import React from 'react';
import { Code, Users, Award, CheckCircle } from 'lucide-react';

export default function SkillsModuleView({ masterProfile }) {
  if (!masterProfile) return null;

  const techSkills = masterProfile?.skills?.technical || [];
  const softSkills = masterProfile?.skills?.soft || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Award className="w-8 h-8 text-emerald-400" /> Comprehensive Skills Analysis
        </h2>
        <p className="text-slate-400">A deep dive into your technical proficiencies and interpersonal capabilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Skills Column */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Code className="w-6 h-6 text-emerald-500" /> Hard / Technical Skills
          </h3>
          <div className="space-y-4">
            {techSkills.map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-slate-700">{skill}</span>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            ))}
            {techSkills.length === 0 && <p className="text-slate-500 italic">No technical skills extracted yet.</p>}
          </div>
        </div>

        {/* Soft Skills Column */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" /> Interpersonal / Soft Skills
          </h3>
          <div className="space-y-4">
            {softSkills.map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="font-medium text-purple-900">{skill}</span>
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              </div>
            ))}
            {softSkills.length === 0 && <p className="text-slate-500 italic">No soft skills extracted yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
