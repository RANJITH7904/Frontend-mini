import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Violation, VIOLATION_CATEGORIES, DEPARTMENTS } from '../types/database';
import { AlertCircle, Clock, CheckCircle, LogOut, Users, Upload, AlertTriangle, TrendingUp } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';


function getStatusStyle(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30';
    case 'acknowledged': return 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30';
    case 'correcting': return 'bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30';
    case 'corrected': return 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30';
    case 'verified': return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30';
    default: return 'bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-500/30';
  }
}

function getWarningLevelBadge(level?: number) {
  switch (level) {
    case 0: return { label: 'Excused', className: 'bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-500/30' };
    case 1: return { label: 'Warning', className: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' };
    default:
      if (level !== undefined && level >= 2) return { label: 'Meet the Parent', className: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30' };
      return null;
  }
}

export default function StaffDashboard() {
  const { userProfile, signOut } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', studentName: '', department: '', category: '', description: '', dueDate: '', priority: 'medium' });

  useEffect(() => { fetchViolations(); }, []);

  const fetchViolations = async () => {
    try { const r = await api.get('/api/violations'); setViolations(r.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setUploading(true);
    try {
      let evidenceUrl = '';
      if (evidencePhoto) {
        const pf = new FormData(); pf.append('photo', evidencePhoto);
        const ur = await api.post('/api/upload/evidence', pf, { headers: { 'Content-Type': 'multipart/form-data' } });
        evidenceUrl = ur.data.url;
      }
      const response = await api.post('/api/violations', { student_id: formData.studentId, student_name: formData.studentName, department: formData.department, category: formData.category, description: formData.description, due_date: formData.dueDate, priority: formData.priority, evidence_url: evidenceUrl || null });
      const nv: Violation = response.data;
      let msg = 'Compliance issue reported successfully!';
      if (nv.warning_level === 1) msg = `⚠️ Report submitted!\n\nWarning Issued: Complaint #${nv.repeat_count} for ${formData.studentName}.\nAction: ${nv.recommended_action}`;
      else if (nv.warning_level !== undefined && nv.warning_level >= 2) msg = `🚨 Report submitted!\n\nParent/Guardian Alert: Complaint #${nv.repeat_count} for ${formData.studentName}.\nAction: ${nv.recommended_action}`;
      setFormData({ studentId: '', studentName: '', department: '', category: '', description: '', dueDate: '', priority: 'medium' });
      setEvidencePhoto(null); setShowReportForm(false); fetchViolations(); alert(msg);
    } catch (e) { console.error(e); alert('Failed to report compliance issue'); } finally { setUploading(false); }
  };

  const stats = {
    total: violations.length,
    pending: violations.filter(v => v.status === 'pending').length,
    resolved: violations.filter(v => v.status === 'verified').length,
    repeatOffenders: violations.filter(v => v.is_repeat_offender).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:bg-none dark:bg-slate-900 transition-colors duration-500 overflow-hidden relative font-['DM_Sans',sans-serif]">
      {/* Background orbs */}
      <div className="fixed top-[-20%] left-[-15%] w-[55%] h-[55%] rounded-full bg-white/10 dark:bg-emerald-500/20 blur-[80px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full bg-white/10 dark:bg-cyan-500/20 blur-[80px] pointer-events-none z-0" />
      
      {/* Navbar */}
      <div className="relative z-10 border-b border-white/15 dark:border-white/5 bg-white/15 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-cyan-500 flex items-center justify-center shadow-lg shadow-black/10">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base tracking-tight">Staff Dashboard</div>
              <div className="text-white/60 dark:text-slate-400 text-xs font-medium">Report Compliance Issues</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-white/15 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg px-3.5 py-1.5 text-white dark:text-slate-300 text-sm font-semibold hidden sm:block">
              Welcome, <strong className="text-white">{userProfile?.full_name}</strong>
            </span>
            <DarkModeToggle />
            <button onClick={signOut} className="flex items-center gap-2 bg-white/15 dark:bg-white/5 hover:bg-white/25 dark:hover:bg-white/10 text-white dark:text-slate-200 border border-white/20 dark:border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Reports', value: stats.total, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20', Icon: AlertCircle },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', Icon: Clock },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', Icon: CheckCircle },
            { label: 'Repeat Offenders', value: stats.repeatOffenders, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20', Icon: TrendingUp },
          ].map(({ label, value, color, bg, border, Icon }) => (
            <div key={label} className={`relative overflow-hidden rounded-2xl p-6 border ${bg} ${border}`}>
              <div className={`absolute top-4 right-4 opacity-20 ${color}`}><Icon size={40} /></div>
              <div className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</div>
              <div className="text-slate-800 dark:text-white text-4xl font-black leading-none">{value}</div>
            </div>
          ))}
        </div>

        {/* Report Form Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 rounded-2xl backdrop-blur-xl shadow-lg dark:shadow-none mb-8">
          <div className={`px-6 py-5 flex justify-between items-center ${showReportForm ? 'border-b border-slate-200 dark:border-white/5' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <AlertCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-slate-800 dark:text-white text-lg font-bold m-0">Report New Compliance Issue</h2>
            </div>
            <button onClick={() => setShowReportForm(!showReportForm)} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              {showReportForm ? 'Hide Form' : 'New Report'}
            </button>
          </div>

          {showReportForm && (
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Student ID *</label>
                  <input type="text" value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} placeholder="e.g., STU001" required className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Student Name *</label>
                  <input type="text" value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} placeholder="Enter student name" required className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Department *</label>
                  <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Select category</option>
                    {VIOLATION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the compliance issue in detail…" required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-h-[100px] resize-y" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Due Date *</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Upload Evidence (Optional)</label>
                <div className="border-2 border-dashed border-emerald-500/30 rounded-xl p-6 text-center bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                  <input type="file" accept="image/*" onChange={e => setEvidencePhoto(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-500/20 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-500/30 cursor-pointer" />
                </div>
              </div>

              <button type="submit" disabled={uploading} className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <Upload size={16} /> {uploading ? 'Submitting…' : 'Submit Compliance Report'}
              </button>
            </form>
          )}
        </div>

        {/* Violations List */}
        <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 rounded-2xl backdrop-blur-xl shadow-lg dark:shadow-none">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5">
            <h2 className="text-slate-800 dark:text-white text-lg font-bold m-0">My Reported Compliances</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">Loading…</div>
            ) : violations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={28} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-bold mb-1">No Reports Found</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">You haven't reported any compliance issues yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {violations.map((v) => {
                  const statusClass = getStatusStyle(v.status);
                  const wb = getWarningLevelBadge(v.warning_level);
                  return (
                    <div key={v.id} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-slate-800 dark:text-white font-extrabold text-base">{v.student_id} — {v.student_name}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusClass}`}>{v.status}</span>
                            {v.is_repeat_offender && wb && <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${wb.className}`}><AlertTriangle size={10} /> {wb.label}</span>}
                            {v.repeat_count && v.repeat_count > 1 && <span className="bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/5 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Offense #{v.repeat_count}</span>}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 font-bold">{v.department}</span>
                            <span className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 font-bold">{v.category}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(v.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 p-4 bg-white dark:bg-white/5 rounded-xl">{v.description}</p>

                      {v.is_repeat_offender && (
                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl p-4 flex gap-2 items-start mb-4">
                          <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-orange-700 dark:text-orange-400 text-sm font-bold block mb-0.5">Recommended Action: </span>
                            <span className="text-orange-600/80 dark:text-orange-300/80 text-sm">{v.recommended_action}</span>
                            {v.escalation_status === 'actioned' && <span className="ml-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md px-2 py-0.5 text-xs font-bold">✓ Actioned</span>}
                          </div>
                        </div>
                      )}

                      {(v.evidence_url || v.correction_url) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {v.evidence_url && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800">
                              <div className="bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-white/10">Evidence Photo</div>
                              <img src={v.evidence_url} alt="Evidence" className="w-full h-36 object-cover hover:scale-105 transition-transform" />
                            </div>
                          )}
                          {v.correction_url && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800">
                              <div className="bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-white/10">Correction Proof</div>
                              <img src={v.correction_url} alt="Correction" className="w-full h-36 object-cover hover:scale-105 transition-transform" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}