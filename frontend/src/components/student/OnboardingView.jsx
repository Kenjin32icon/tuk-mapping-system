// components/OnboardingView.jsx
import React from 'react';
import { UploadCloud, FileText, ArrowRight, AlertCircle } from 'lucide-react';

export default function OnboardingView({ user, onFileChange, isUploading, onSkip, isGuest }) {
  return (
    <div className="max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* NEW: GUEST WARNING */}
      {isGuest && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
           <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
           <p className="text-sm font-medium">Guest mode uploads are disabled. To process your real documents, please log out and sign in with Google.</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <UploadCloud className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {user?.displayName?.split(' ')[0]}</h2>
        <p className="text-slate-500 mb-8">
          Upload your coursework, projects, or CV (PDF/DOCX) to generate your AI-powered Kenyan market profile.
        </p>

        <label className="relative group cursor-pointer block mb-6">
          <div className="border-2 border-dashed border-slate-200 group-hover:border-emerald-400 rounded-2xl p-10 transition-all bg-slate-50 group-hover:bg-emerald-50/30">
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={onFileChange}
              disabled={isUploading || isGuest}
            />
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
            <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-700">
              {isUploading ? "Processing..." : "Click to browse or drag and drop files"}
            </span>
          </div>
        </label>
        
        <button 
          onClick={onSkip}
          className="text-sm font-bold text-slate-500 hover:text-emerald-600 flex items-center justify-center mx-auto gap-2 transition-colors"
        >
          Skip this step & go to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
