// src/components/admin/StudentDirectory.jsx
import React, { useState } from 'react';
import { Search, Loader2, Mail, Phone, Eye, X, Briefcase, Award, MapPin } from 'lucide-react';

export default function StudentDirectory({ students, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null); // Tracks the student being viewed

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.bestSector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500 relative">
      {/* Header & Search */}
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
      
      {/* Directory Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
              <tr>
                <th className="p-4 border-b">Student Info</th>
                <th className="p-4 border-b">Target Role</th>
                <th className="p-4 border-b">Best Sector</th>
                <th className="p-4 border-b">Market Readiness</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student._id || student.email} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{student.name}</p>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {student.email}</span>
                      {student.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {student.phone}</span>}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-emerald-700">{student.role || "Pending Analysis"}</td>
                  <td className="p-4 text-slate-600 font-medium">{student.bestSector || "N/A"}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-2 max-w-[80px]">
                        <div className={`h-2 rounded-full ${student.readiness > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${student.readiness || 0}%` }}></div>
                      </div>
                      <span className="font-bold text-slate-700">{student.readiness || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {/* View Profile Button */}
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No consolidated profiles found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Profile Modal Overlay */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md p-6 border-b border-slate-100 flex justify-between items-start z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedStudent.name}</h2>
                <div className="flex gap-4 mt-2 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {selectedStudent.email}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {selectedStudent.bestSector || "Sector Pending"}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)} 
                className="p-2 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Pre-generated AI Description (Executive Summary) */}
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <h3 className="text-emerald-800 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" /> AI Student Overview
                </h3>
                <p className="text-emerald-900 leading-relaxed text-sm">
                  {/* Fallback chain in case the prompt structure varies slightly */}
                  {selectedStudent.masterProfile?.executive_summary || 
                   selectedStudent.bio || 
                   "This student's AI-generated executive summary is currently processing or unavailable. They have uploaded documents and are awaiting full synthesis."}
                </p>
              </div>

              {/* Grid for Role & Readiness */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Recommended Role</p>
                  <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" /> 
                    {selectedStudent.masterProfile?.recommended_role?.title || selectedStudent.role || "N/A"}
                  </p>
                </div>
                <div className="border border-slate-200 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Market Readiness Score</p>
                  <p className="text-lg font-black text-emerald-600">
                    {selectedStudent.masterProfile?.kenyan_market_alignment?.market_readiness_score || selectedStudent.readiness || 0}/100
                  </p>
                </div>
              </div>

              {/* Skills Section */}
              {selectedStudent.masterProfile?.skills_inventory && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Verified Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Map through technical skills if available */}
                    {selectedStudent.masterProfile.skills_inventory.technical_skills?.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                        {skill}
                      </span>
                    ))}
                    {selectedStudent.masterProfile.skills_inventory.soft_skills?.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <a 
                href={`mailto:${selectedStudent.email}`}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
              >
                Contact Student
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}