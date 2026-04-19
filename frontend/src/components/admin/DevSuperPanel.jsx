// src/components/admin/DevSuperPanel.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Users, Activity, Database, Search, Loader2, Key } from 'lucide-react';
import { auth } from '../../firebase';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DevSuperPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Global Data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      if (activeTab === 'users') {
        const res = await axios.get(`${API_BASE_URL}/api/super/users`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data);
      } else if (activeTab === 'logs') {
        const res = await axios.get(`${API_BASE_URL}/api/super/logs`, { headers: { Authorization: `Bearer ${token}` } });
        setLogs(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch secure data.");
    } finally {
      setLoading(false);
    }
  };

  // RBAC Privilege Controller
  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(`${API_BASE_URL}/api/super/role`, { userId, newRole }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success("User privilege updated!");
      // Update local state to reflect change instantly
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      toast.error("Failed to update user role.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Super Admin Header */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-purple-500">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" /> Developer Super-Panel
          </h2>
          <p className=\"text-slate-400\">Global System Administration & Security Oversight</p>
        </div>
        <div className="bg-purple-500/20 px-4 py-2 rounded-lg text-sm border border-purple-500/30 text-purple-300 font-bold tracking-widest uppercase">
          ROOT ACCESS GRANTED
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button onClick={() => setActiveTab('users')} className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
          <Users className="w-4 h-4"/> Global User Control
        </button>
        <button onClick={() => setActiveTab('logs')} className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'logs' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
          <Activity className="w-4 h-4"/> Audit Logs
        </button>
      </div>

      {/* TAB: Global User Control */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Database className="w-5 h-5 text-blue-500"/> System Database</h3>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search email or name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-purple-500 outline-none" 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-12 text-purple-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-500 uppercase font-bold text-xs tracking-wider">
                  <tr>
                    <th className="p-4 border-b">Identity</th>
                    <th className="p-4 border-b">Registered Date</th>
                    <th className="p-4 border-b">Has Master Profile</th>
                    <th className="p-4 border-b text-right">Privilege Control (RBAC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                      </td>
                      <td className="p-4 text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        {u.masterProfile ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">YES</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-bold">NO</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Key className={`w-4 h-4 ${u.role === 'SUPER_ADMIN' ? 'text-purple-500' : 'text-slate-300'}`} />
                          <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="border border-slate-200 rounded-lg text-xs font-bold p-2 bg-white cursor-pointer outline-none focus:border-purple-500"
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="UNIVERSITY_ADMIN">UNIVERSITY_ADMIN</option>
                            <option value="GOVT_ADMIN">GOVT_ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500"/> Real-time System Audit</h3>
            <p className="text-xs text-slate-500 mt-1">Showing latest 100 system events.</p>
          </div>
          <div className="overflow-x-auto">
             {loading ? (
              <div className="flex justify-center p-12 text-purple-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                  <tr>
                    <th className="p-4 border-b">Timestamp</th>
                    <th className="p-4 border-b">Actor (Email)</th>
                    <th className="p-4 border-b">Event Type</th>
                    <th className="p-4 border-b">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-700">{log.userEmail}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">{log.action}</span>
                      </td>
                      <td className="p-4 text-slate-600">{log.details}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-500">No logs recorded yet.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
