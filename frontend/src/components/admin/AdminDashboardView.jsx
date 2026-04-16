import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertTriangle, Briefcase, TrendingUp, Search, UserCheck, Loader2 } from 'lucide-react';
import { auth } from '../../firebase'; // ⬅️ Correct path! Two folders up.

export default function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await axios.get('http://localhost:5000/api/admin/students', {
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
      
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">Institutional Control Center</h2>
          <p className="text-slate-400">TU-K Student Talent Pipelines & Market Analytics</p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-lg text-sm border border-white/10 text-emerald-400 font-medium">
          Access Level: UNIVERSITY_ADMIN
        </div>
      </div>

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

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users /></div>
              <p className="text-sm text-slate-500 font-bold uppercase">Total Profiles</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{students.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp /></div>
              <p className="text-sm text-slate-500 font-bold uppercase">Avg Market Readiness</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{averageReadiness}%</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-xl text-red-600"><AlertTriangle /></div>
              <p className="text-sm text-red-700 font-bold uppercase">Curriculum Deficits</p>
            </div>
            <p className="text-xl font-bold text-slate-800">Cloud Computing (AWS)</p>
          </div>
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Student Talent Database</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Search skills..." className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-12 text-emerald-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-4 border-b">Student</th>
                    <th className="p-4 border-b">Recommended Role</th>
                    <th className="p-4 border-b">Market Fit</th>
                    <th className="p-4 border-b">Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </td>
                      <td className="p-4 font-medium text-emerald-700">{student.role}</td>
                      <td className="p-4 text-slate-600">{student.bestSector}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 rounded-full h-2 max-w-[80px]">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${student.readiness}%` }}></div>
                          </div>
                          <span className="font-bold text-slate-700">{student.readiness}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-500">No student data available.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'job_matching' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Paste Job Description</h3>
            <textarea 
              className="w-full h-48 border border-slate-200 rounded-xl p-4 text-sm focus:border-emerald-500 outline-none"
              placeholder="e.g. Looking for a Developer familiar with Django..."
            ></textarea>
            <button className="mt-4 w-full bg-emerald-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
              <Search className="w-4 h-4"/> Run AI Talent Match
            </button>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
             <UserCheck className="w-12 h-12 text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Run a match to view the top 3 student candidates.</p>
          </div>
        </div>
      )}
    </div>
  );
}
