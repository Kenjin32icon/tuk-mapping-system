import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SkillList from '../shared/SkillList';
import ShareModal from '../shared/ShareModal';
import {
  Download, BrainCircuit, TrendingUp, Target, Activity, Info, Share2,
  AlertTriangle, UploadCloud, Sparkles, ChevronRight, BookOpen, Briefcase, Layers
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATE CARD — safe null check on roleTitle
// ─────────────────────────────────────────────────────────────────────────────
const AffiliateCard = ({ roleTitle }) => {
  const affiliateLink = "https://aal4.adj.st/ke?adjust_deeplink=jumia%3a%2f%2fke&adj_label=casid*d3f90e60-0fc7-4de1-acb2-b9449a1a05a0^type*jforce&adjust_t=1w7aejdk_1wskofxs&adjust_campaign=JF_Affiliate_KE&adjust_redirect=https%3A%2F%2Fwww.jumia.co.ke%2F%3futm_source%3dJFORCE%26utm_medium%3dJF_Affiliate%26utm_campaign%3dJF_Affiliate_KE%26adj_label=casid*d3f90e60-0fc7-4de1-acb2-b9449a1a05a0^type*jforce";

  // ✅ FIX: Safely lowercase only when roleTitle is a non-empty string
  const roleLower = typeof roleTitle === 'string' ? roleTitle.toLowerCase() : '';

  let gear = { category: "Productivity", item: "High-Performance Laptops", link: affiliateLink };

  if (roleLower.includes('software') || roleLower.includes('developer')) {
    gear = { category: "Coding", item: "External Monitors & Mechanical Keyboards", link: affiliateLink };
  } else if (roleLower.includes('design') || roleLower.includes('creative')) {
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

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE — shown when user has no profile yet (not guest)
// ─────────────────────────────────────────────────────────────────────────────
const EmptyStateBanner = ({ onUploadClick, onGenerateMaster, isSynthesizing, documentCount, setView }) => (
  <div className="space-y-4">
    {/* Step-by-step guidance card */}
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Dashboard is Ready</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            You're logged in! Follow the steps below to unlock your full AI-powered career profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Step 1 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold">1</div>
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-bold text-white mb-1">Upload Documents</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Upload your CV, transcripts, project reports, or certificates (PDF/DOCX). <strong className="text-amber-400">This step is required</strong> to generate your profile.
            </p>
          </div>
          <button
            onClick={onUploadClick}
            className="mt-auto w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Now
          </button>
        </div>

        {/* Step 2 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold">2</div>
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-bold text-white mb-1">Generate Master Profile</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              After uploading at least 2 documents, generate your AI Master Profile to unlock skills analysis, market readiness scores, and sector demand data.
            </p>
          </div>
          <button
            onClick={onGenerateMaster}
            disabled={isSynthesizing || documentCount < 2}
            className="mt-auto w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <BrainCircuit className="w-4 h-4" />
            {isSynthesizing ? 'Generating...' : 'Generate Profile'}
          </button>
        </div>

        {/* Step 3 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 opacity-60">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold">3</div>
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="font-bold text-white mb-1">Explore Modules</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Access Skills Analysis, Kenyan Market Alignment, Service Recommendations, and Portfolio Builder — all unlocked after your Master Profile is ready.
            </p>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-1">
            {['Skills', 'Market', 'Services'].map(m => (
              <div key={m} className="text-center py-1.5 bg-white/5 rounded-lg text-xs text-slate-400 font-medium">{m}</div>
            ))}
          </div>
        </div>
      </div>

      {documentCount > 0 && documentCount < 2 && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">
            You've uploaded <strong>{documentCount} document</strong>. Upload at least 2 to enable Master Profile generation, or 5 for the strongest insights.
          </p>
        </div>
      )}
    </div>

    {/* Feature preview locked cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { icon: BookOpen, label: 'Skills Analysis', desc: 'See your ranked technical, soft, and transferable skills mapped to market demand.', color: 'blue' },
        { icon: TrendingUp, label: 'Market Alignment', desc: 'Discover which Kenyan sectors need your exact skill set most urgently.', color: 'emerald' },
        { icon: Briefcase, label: 'Service Recommendations', desc: 'Get AI-curated freelance and employment services you can offer right now.', color: 'purple' },
      ].map(({ icon: Icon, label, desc, color }) => (
        <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
          <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center mb-3`}>
            <Icon className={`w-5 h-5 text-${color}-500`} />
          </div>
          <h4 className="font-bold text-slate-800 mb-1 text-sm">{label}</h4>
          <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              🔒 Unlock with Master Profile
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardView({
  user, profile, masterProfile, onUploadDocuments, onDownload,
  onGenerateMaster, isSynthesizing, isGuest, apiBaseUrl, setView
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const fileInputRef = useRef(null);

  const activeProfile = masterProfile || profile;

  const profileData = activeProfile || {
    bio: null,
    skills: { technical: [], soft: [] },
    kenyan_market_alignment: { best_skill_area_expertise: 'Student Talent', description: '', market_readiness_score: 0 },
    sector_demand: [{ sector: 'General Tech', demand_percentage: 45 }],
    recommended_role: { title: 'Awaiting analysis', description: '' },
    marketable_services: []
  };

  // Fetch document count for non-guest users who haven't generated a master profile yet
  useEffect(() => {
    if (!masterProfile && !isGuest && user) {
      const fetchDocumentCount = async () => {
        try {
          const token = await user.getIdToken();
          const response = await axios.get(`${apiBaseUrl}/api/user-profile-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDocumentCount(response.data.count);
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

  const sectorData = activeProfile?.sector_demand || [{ sector: "General Tech", demand_percentage: 50 }];
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto" id="master-dashboard-export">

      {/* Hidden file input */}
      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={onUploadDocuments} />

      {/* ── GUEST MODE BANNER ──────────────────────────────────────────────── */}
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

      {/* ── UPLOAD REMINDER for real users with some docs but none synthesised ── */}
      {!isGuest && !masterProfile && documentCount >= 2 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-3xl shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 mt-0.5 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold">Ready to generate your Master Profile</h3>
                <p className="text-sm text-amber-700">
                  You have {documentCount} document{documentCount !== 1 ? 's' : ''} uploaded.
                  {documentCount < 5 ? ` Add ${5 - documentCount} more for stronger AI insights, or generate now.` : ' You have enough for a comprehensive analysis!'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                Add More
              </button>
              <button
                onClick={onGenerateMaster}
                disabled={isSynthesizing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
              >
                <BrainCircuit className="w-4 h-4" />
                {isSynthesizing ? 'Generating...' : 'Generate Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMPTY STATE (no documents at all, not guest) ───────────────────── */}
      {!activeProfile && !isGuest && (
        <EmptyStateBanner
          onUploadClick={() => fileInputRef.current?.click()}
          onGenerateMaster={onGenerateMaster}
          isSynthesizing={isSynthesizing}
          documentCount={documentCount}
          setView={setView}
        />
      )}

      {/* ── PROFILE ACTION BAR — always visible when user is logged in ─────── */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 profile-action-bar">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-emerald-500 overflow-hidden flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" crossOrigin="anonymous" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-emerald-400">{user?.displayName?.[0] || '?'}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.displayName}</h2>
            <p className="text-emerald-400 font-medium text-sm">
              {activeProfile?.recommended_role?.title || (isGuest ? 'Demo Profile' : 'Upload documents to get started')}
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto flex-wrap justify-end">
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
            className="hidden md:inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            <UploadCloud className="w-4 h-4" /> Upload
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

          <button
            onClick={onDownload}
            className="p-3 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── ACTIVE PROFILE CONTENT — only renders when there's data ──────── */}
      {activeProfile && (
        <>
          {/* BIO MODULE */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Professional Summary
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">{activeProfile.bio}</p>
          </div>

          {/* VISUALISATION MODULE */}
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
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
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

          {/* SKILLS MODULE */}
          <div className="space-y-6">
            <SkillList title="Core Technical Expertise" skills={activeProfile.skills?.technical} />
            <SkillList title="Essential Soft Skills" skills={activeProfile.skills?.soft} />
          </div>

          {/* MODULE NAVIGATION CTA — only show when master profile exists */}
          {masterProfile && setView && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 module-navigation">
              {[
                { view: 'module_skills', icon: BookOpen, label: 'Skills Analysis', desc: 'Deep dive into your skill rankings', color: 'blue' },
                { view: 'module_market', icon: TrendingUp, label: 'Market Alignment', desc: 'Sector demand & readiness scores', color: 'emerald' },
                { view: 'module_services', icon: Briefcase, label: 'Service Recommendations', desc: 'AI-curated services you can offer', color: 'purple' },
              ].map(({ view: targetView, icon: Icon, label, desc, color }) => (
                <button
                  key={targetView}
                  onClick={() => setView(targetView)}
                  className={`bg-white border border-slate-200 hover:border-${color}-300 hover:shadow-md rounded-2xl p-5 text-left transition-all group`}
                >
                  <div className={`w-10 h-10 bg-${color}-50 group-hover:bg-${color}-100 rounded-xl flex items-center justify-center mb-3 transition-colors`}>
                    <Icon className={`w-5 h-5 text-${color}-500`} />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-0.5 text-sm">{label}</h4>
                  <p className="text-slate-500 text-xs">{desc}</p>
                  <div className={`mt-3 flex items-center gap-1 text-xs font-semibold text-${color}-600`}>
                    Open module <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* AFFILIATE CARD */}
          {!isGuest && (
            <AffiliateCard roleTitle={activeProfile?.recommended_role?.title} />
          )}
        </>
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