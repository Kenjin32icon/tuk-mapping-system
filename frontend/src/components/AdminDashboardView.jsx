import React, { useState } from 'react';
import { Users, AlertTriangle, Briefcase, TrendingUp, Search, UserCheck } from 'lucide-react';

export default function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Admin Header */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">Institutional Control Center</h2>
          <p className="text-slate-400">TU-K Student Talent Pipelines & Market Analytics</p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-lg text-sm border border-white/10 text-emerald-400 font-medium">
          Access Level: UNIVERSITY_ADMIN
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['overview', 'directory', 'job_matching', 'curriculum_deficits'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview / KPIs */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users /></div>
              <p className="text-sm text-slate-500 font-bold uppercase">Total Students</p>
            </div>
            <p className="text-3xl font-black text-slate-800">1,284</p>
            <p className="text-xs text-emerald-600 font-bold mt-2">+124 this month</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp /></div>
              <p className="text-sm text-slate-500 font-bold uppercase">Avg Market Readiness</p>
            </div>
            <p className="text-3xl font-black text-slate-800">68%</p>
            <p className="text-xs text-amber-600 font-bold mt-2">Needs Improvement</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Briefcase /></div>
              <p className="text-sm text-slate-500 font-bold uppercase">AI Placements</p>
            </div>
            <p className="text-3xl font-black text-slate-800">342</p>
            <p className="text-xs text-slate-400 font-medium mt-2">Students shortlisted via AI</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-xl text-red-600"><AlertTriangle /></div>
              <p className="text-sm text-red-700 font-bold uppercase">Curriculum Deficits</p>
            </div>
            <p className="text-xl font-bold text-slate-800">Cloud Computing (AWS)</p>
            <p className="text-xs text-red-600 font-medium mt-2">High Market Demand vs Low Supply</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Job Matching Workflow */}
      {activeTab === 'job_matching' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">1. Paste Job Description</h3>
            <textarea 
              className="w-full h-48 border border-slate-200 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none"
              placeholder="e.g. We are looking for a Junior Python Developer familiar with Django and Postgres..."
            ></textarea>
            <button className="mt-4 w-full bg-emerald-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
              <Search className="w-4 h-4"/> Run AI Talent Match
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
             <UserCheck className="w-12 h-12 text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Run a match to view the top 3 student candidates.</p>
             <p className="text-xs text-slate-400 mt-2">The system will automatically extract skills from the JD and rank the database.</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Placeholder for others */}
      {(activeTab === 'directory' || activeTab === 'curriculum_deficits') && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 italic">
          Data visualization module for {activeTab.replace('_', ' ')} is under construction.
        </div>
      )}
    </div>
  );
}
