import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SkillList from '../shared/SkillList'; // ⬅️ UPDATED PATH
import ShareModal from '../shared/ShareModal'; // ⬅️ NEW IMPORT
import { Download, BrainCircuit, TrendingUp, Target, Activity, Info, Share2, AlertTriangle } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

// Add this helper component at the top of DashboardView.jsx (outside the main export function)
const AffiliateCard = ({ roleTitle }) => {
  // Your provided Jumia Affiliate Link
  const affiliateLink = "https://aal4.adj.st/ke?adjust_deeplink=jumia%3a%2f%2fke&adj_label=casid*d3f90e60-0fc7-4de1-acb2-b9449a1a05a0^type*jforce&adjust_t=1w7aejdk_1wskofxs&adjust_campaign=JF_Affiliate_KE&adjust_redirect=https%3A%2F%2Fwww.jumia.co.ke%2F%3futm_source%3dJFORCE%26utm_medium%3dJF_Affiliate%26utm_campaign%3dJF_Affiliate_KE%26adj_label=casid*d3f90e60-0fc7-4de1-acb2-b9449a1a05a0^type*jforce";

  // Simple logic to match gear to the AI's recommended role
  let gear = { category: "Productivity", item: "High-Performance Laptops", link: affiliateLink };
  
  if (roleTitle && roleTitle.toLowerCase().includes('software') || roleTitle.toLowerCase().includes('developer')) {
    gear = { category: "Coding", item: "External Monitors & Mechanical Keyboards", link: affiliateLink };
  } else if (roleTitle && roleTitle.toLowerCase().includes('design') || roleTitle.toLowerCase().includes('creative')) {
    gear = { category: "Creative", item: "Graphics Tablets & Color-Accurate Displays", link: affiliateLink };
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

export default function DashboardView({ user, profile, masterProfile, onUploadDocuments, onDownload, onGenerateMaster, isSynthesizing, isGuest, apiBaseUrl }) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const fileInputRef = useRef(null);

  const activeProfile = masterProfile || profile;
  const profileData = activeProfile || {
    bio: "You haven't uploaded any documents yet. Use the button below to get started.",
    skills: { technical: [], soft: [] },
    kenyan_market_alignment: { best_skill_area_expertise: 'Student Talent', description: 'Upload documents to begin building your profile.', market_readiness_score: 0 },
    sector_demand: [{ sector: 'General Tech', demand_percentage: 45 }],
    recommended_role: { title: 'Awaiting analysis', description: 'Upload at least 5 documents to generate a master profile.' },
    marketable_services: []
  };
  const needsUploadReminder = !activeProfile && !isGuest;

  useEffect(() => {
    if (!masterProfile && !isGuest && user) {
      const fetchDocumentCount = async () => {
        try {
          const token = await user.getIdToken();
          const response = await axios.get(`${apiBaseUrl}/api/user-profile-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDocumentCount(response.data.count);
          setShowAlert(response.data.count < 5);
        } catch (error) {
          console.error('Error fetching document count:', error);
        }
      };
      fetchDocumentCount();
    }
  }, [masterProfile, user, isGuest, apiBaseUrl]);

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

      {showAlert && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-3xl shadow-sm mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 mt-1 text-amber-600" />
              <div>
                <h3 className="text-lg font-bold">Keep your dashboard active</h3>
                <p className="text-sm text-amber-700">
                  You have uploaded {documentCount} document{documentCount !== 1 ? 's' : ''}. Upload at least 5 documents to generate a reliable master profile and unlock better AI insights.
                </p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
            >
              Upload more documents
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={onUploadDocuments}
      />

      {!activeProfile && !isGuest && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Upload Documents to Activate Your Dashboard</h3>
              <p className="text-slate-600 mt-2">
                No analysis is available yet. Upload at least 5 documents (coursework, projects, CV) to generate a master profile and see stronger dashboard insights.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Upload Documents
              </button>
              <button
                onClick={onGenerateMaster}
                className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Generate Master Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 0. DASHBOARD READY STATE */}
      {!activeProfile && !isGuest && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Your dashboard is ready.</h2>
          <p className="text-slate-600 mb-4">
            You can still access your dashboard even without uploading documents. Start by uploading up to 5 files to generate your Master Profile and unlock deeper insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Upload Documents
            </button>
            <button
              onClick={onGenerateMaster}
              disabled={isSynthesizing}
              className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {isSynthesizing ? 'Generating...' : 'Generate Master Profile'}
            </button>
          </div>
        </div>
      )}

      {/* 1. PERSISTENT MASTER PROFILE ACTION BAR */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 profile-action-bar">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-emerald-500 overflow-hidden">
            <img src={user?.photoURL} alt="Profile" crossOrigin="anonymous" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.displayName}</h2>
            <p className="text-emerald-400 font-medium">{profileData.recommended_role?.title || 'Profile Under Analysis'}</p>
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
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden md:inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Upload documents
          </button>

          {masterProfile && (
            <button 
              onClick={() => setShowShareModal(true)}
              className="p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
              title="Share your profile"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          
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

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="TU-K Talent Profile"
        description={`Check out my AI-generated career profile as a ${profileData?.recommended_role?.title || 'Professional'}`}
        url={`${window.location.origin}/profile/${user?.uid}`}
        user={user}
      />

    </div>
  );
}