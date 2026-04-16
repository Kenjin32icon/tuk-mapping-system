// src/components/admin/StudentDirectory.jsx
import React, { useState } from 'react';
import { Search, Loader2, Mail, Phone } from 'lucide-react';

export default function StudentDirectory({ students, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.bestSector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800">Master Profile Database</h3>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or sector..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 outline-none" 
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-12 text-emerald-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-500 uppercase font-bold text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b">Student / Contact</th>
                <th className="p-4 border-b">Recommended Role</th>
                <th className="p-4 border-b">Market Fit Sector</th>
                <th className="p-4 border-b">Readiness KPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{student.name}</p>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {student.email}</span>
                      {student.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {student.phone}</span>}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-emerald-700">{student.role}</td>
                  <td className="p-4 text-slate-600 font-medium">{student.bestSector}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-2 max-w-[80px]">
                        <div className={`h-2 rounded-full ${student.readiness > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${student.readiness}%` }}></div>
                      </div>
                      <span className="font-bold text-slate-700">{student.readiness}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No consolidated profiles found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
