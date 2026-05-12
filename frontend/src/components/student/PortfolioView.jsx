import React from 'react';
import ShareModal from '../shared/ShareModal'; // ⬅️ NEW IMPORT
import { Briefcase, Download, ArrowLeft, Code, CheckCircle, Share2 } from 'lucide-react';

export default function PortfolioView({ portfolioData, onBack, onDownload }) {
  const [showShareModal, setShowShareModal] = React.useState(false);

  if (!portfolioData) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl mx-auto" id="portfolio-export">
      
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </button>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-400" /> {portfolioData.portfolio_title}
          </h2>
          <p className="text-slate-400 max-w-2xl">{portfolioData.targeted_bio}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowShareModal(true)}
            className="p-3 bg-slate-800 hover:bg-blue-600 rounded-xl transition-colors"
            title="Share portfolio"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <button onClick={onDownload} className="p-3 bg-slate-800 hover:bg-blue-600 rounded-xl transition-colors">
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Your Value Proposition</h3>
        <p className="text-blue-900 text-lg leading-relaxed">{portfolioData.value_proposition}</p>
      </div>

      <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Targeted Projects to Build</h3>
      <div className="space-y-6">
        {portfolioData.projects.map((project, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-slate-900 text-white px-4 py-1 rounded-bl-xl font-bold text-sm">
              Project 0{idx + 1}
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">{project.project_name}</h4>
            <p className="text-slate-500 mb-4 italic text-sm">"{project.github_readme_pitch}"</p>
            <p className="text-slate-600 mb-6 max-w-3xl">{project.problem_statement}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Code className="w-4 h-4"/> Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech, i) => (
                    <span key={i} className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-md font-bold">{tech}</span>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Key Features</p>
                <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                  {project.features.map((feature, i) => <li key={i}>{feature}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Portfolio"
        description={`Check out my professional portfolio: ${portfolioData.portfolio_title}`}
        url={`${window.location.origin}/portfolio/${portfolioData.id || 'shared'}`}
        user={null}
      />

    </div>
  );
}