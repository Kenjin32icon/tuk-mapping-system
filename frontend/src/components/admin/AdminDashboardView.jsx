// src/components/admin/AdminDashboardView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { auth } from '../../firebase';

// Import our new separated modules
import StudentDirectory from './StudentDirectory';
import JobMatching from './JobMatching';

export default function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await axios.get('https://tuk-mapping-system.onrender.com/api/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(response.data);
      } catch (error) {
        console.error("Failed to fetch students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const averageReadiness = students.length 
    ? Math.round(students.reduce((acc, s) => acc + s.readiness, 0) / students.length) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Admin Header */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">Institutional Control Center</h2>
          <p className="text-slate-400">Consolidated Master Profile Database & Analytics</p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-lg text-sm border border-emerald-500/30 text-emerald-400 font-medium tracking-wider">
          SYSTEM: MATERIALIZED STATE
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['overview', 'directory', 'job_matching'].map((tab) => (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users /></div>
              <p className="text-sm text-slate-500 font-bold uppercase">Consolidated Profiles</p>
            </div>
            <p className="text-4xl font-black text-slate-800">{students.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp /></div>
              <p className="text-sm text-slate-500 font-bold uppercase">Avg Market Readiness</p>
            </div>
            <p className="text-4xl font-black text-slate-800">{averageReadiness}%</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 bg-red-50/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-xl text-red-600"><AlertTriangle /></div>
              <p className="text-sm text-red-700 font-bold uppercase">Curriculum Deficits</p>
            </div>
            <p className="text-xl font-bold text-slate-800 leading-tight">Cloud Computing (AWS)</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Sub-Modules */}
      {activeTab === 'directory' && <StudentDirectory students={students} loading={loading} />}
      {activeTab === 'job_matching' && <JobMatching />}

    </div>
  );
}
