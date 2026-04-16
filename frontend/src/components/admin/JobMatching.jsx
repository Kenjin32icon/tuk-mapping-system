// src/components/admin/JobMatching.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Search, UserCheck, Loader2, Send } from 'lucide-react';
import { auth } from '../../firebase';

export default function JobMatching() {
  const [jd, setJd] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState(null);

  const handleMatch = async () => {
    if (!jd.trim()) return alert("Please enter a job description.");
    setIsMatching(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post('http://localhost:5000/api/match-job', { jobDescription: jd }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data.matches);
    } catch (error) {
      alert("Failed to generate matches.");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
      
      {/* Input Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <h3 className="font-bold text-slate-800 mb-4 text-lg">1. Input Market Requirements</h3>
        <p className="text-sm text-slate-500 mb-4">Paste a Job Description from Safaricom, Ajira, or local tech hubs. The AI will scan all consolidated Master Profiles for exact fits.</p>
        <textarea 
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="w-full flex-1 min-h-[250px] border border-slate-200 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none resize-none bg-slate-50"
          placeholder="e.g. We are looking for a Junior Python Developer familiar with Django, PostgreSQL, and basic Cloud deployment on AWS..."
        ></textarea>
        <button 
          onClick={handleMatch}
          disabled={isMatching}
          className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isMatching ? <Loader2 className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5"/>}
          {isMatching ? 'Analyzing Master Database...' : 'Run AI Talent Match'}
        </button>
      </div>

      {/* Output Section */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col">
        <h3 className="font-bold text-slate-800 mb-4 text-lg">2. Top Candidates</h3>
        
        {!matches && !isMatching && (
          <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50">
             <UserCheck className="w-16 h-16 text-slate-400 mb-4" />
             <p className="text-slate-600 font-bold text-lg">Awaiting Query</p>
             <p className="text-sm text-slate-500 mt-2 max-w-xs">Run a match to automatically sort and rank the student database.</p>
          </div>
        )}

        {matches && (
          <div className="space-y-4 overflow-y-auto pr-2">
            {matches.map((match, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 font-black text-xs px-3 py-1 rounded-bl-xl">
                  {match.matchPercentage}% MATCH
                </div>
                <h4 className="font-bold text-slate-800 text-lg pr-16">{match.name}</h4>
                <p className="text-xs text-slate-400 mb-3">{match.email}</p>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 mb-4">
                  <p className="text-sm text-emerald-900 leading-relaxed font-medium">"{match.reason}"</p>
                </div>
                <button className="w-full py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Notify Candidate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
