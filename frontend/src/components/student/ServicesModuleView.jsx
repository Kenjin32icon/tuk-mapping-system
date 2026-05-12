import React from 'react';
import ShareModal from '../shared/ShareModal'; // ⬅️ NEW IMPORT
import { Briefcase, Zap, Star, Share2 } from 'lucide-react';

export default function ServicesModuleView({ masterProfile, onPrepare }) {
  const [showShareModal, setShowShareModal] = React.useState(false);

  if (!masterProfile) return null;

  const services = masterProfile?.marketable_services || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-400" /> Recommended Services
          </h2>
          <p className="text-slate-400">Actionable, high-demand freelance and professional services you can offer immediately.</p>
        </div>
        <button 
          onClick={() => setShowShareModal(true)}
          className="p-3 bg-slate-800 hover:bg-blue-600 rounded-xl transition-colors"
          title="Share services"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Demand Score</p>
                <p className="text-lg font-black text-emerald-500 flex items-center gap-1 justify-end">
                  {service.demand_score}% <Star className="w-4 h-4 fill-emerald-500" />
                </p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight">{service.service_name}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{service.description}</p>
            
            {/* UPDATED BUTTON */}
            <button 
              onClick={() => onPrepare(service)}
              className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors"
            >
              Prepare Portfolio
            </button>
          </div>
        ))}
      </div>

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Recommended Services"
        description="Check out my AI-recommended professional services and career opportunities"
        url={`${window.location.origin}/services/shared`}
        user={null}
      />

    </div>
  );
}
