import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SkillList({ title, skills }) {
  const [showAll, setShowAll] = useState(false);
  
  if (!skills || skills.length === 0) return null;

  const visibleSkills = showAll ? skills : skills.slice(0, 5);
  const hasMore = skills.length > 5;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="flex flex-col gap-2">
        {visibleSkills.map((skill, index) => (
          <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
            {skill}
          </span>
        ))}
      </div>
      
      {hasMore && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex items-center text-sm text-tukAccent hover:text-blue-700 font-medium"
        >
          {showAll ? <><ChevronUp className="w-4 h-4 mr-1"/> Show Less</> : <><ChevronDown className="w-4 h-4 mr-1"/> Show {skills.length - 5} More</>}
        </button>
      )}
    </div>
  );
}
