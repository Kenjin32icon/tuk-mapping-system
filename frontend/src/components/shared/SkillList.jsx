import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SkillList({ title, skills }) {
  const [showAll, setShowAll] = useState(false);
  
  if (!skills || skills.length === 0) return null;

  const visibleSkills = showAll ? skills : skills.slice(0, 5);
  const hasMore = skills.length > 5;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {visibleSkills.map((skill, index) => (
          <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
            {skill}
          </span>
        ))}
      </div>
      
      {hasMore && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="mt-4 flex items-center text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors"
        >
          {showAll ? (
            <><ChevronUp className="w-4 h-4 mr-1"/> SHOW LESS</>
          ) : (
            <><ChevronDown className="w-4 h-4 mr-1"/> SHOW {skills.length - 5} MORE</>
          )}
        </button>
      )}
    </div>
  );
}
