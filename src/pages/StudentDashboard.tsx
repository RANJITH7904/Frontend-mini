import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Violation } from '../types/database';
import { AlertCircle, CheckCircle, Clock, Upload, LogOut, User, GraduationCap, Building2, AlertTriangle, ShieldAlert } from 'lucide-react';
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

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'high': return 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30';
    case 'medium': return 'bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30';
    default: return 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30';
  }
}

function getWarningLevelInfo(level?: number) {
  switch (level) {
    case 0: return { label: 'Excused – First Complaint', className: 'bg-slate-100 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-500/30' };
    case 1: return { label: 'Warning Issued', className: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' };
    default:
      if (level !== undefined && level >= 2) return { label: 'Meet the Parent', className: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30' };
      return null;
  }
}

export default function StudentDashboard() {
  const { userProfile, signOut } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [correctionPhoto, setCorrectionPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchViolations(); }, [userProfile]);

  const fetchViolations = async () => {
    try { const r = await api.get('/api/violations'); setViolations(r.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const acknowledgeViolation = async (id: string) => {
    try { await api.patch(`/api/violations/${id}`, { status: 'acknowledged' }); fetchViolations(); }
    catch (e) { console.error(e); alert('Failed to acknowledge violation'); }
  };

  const uploadCorrectionProof = async (id: string) => {
    if (!correctionPhoto) return;
    setUploading(true);
    try {
      const pf = new FormData(); pf.append('photo', correctionPhoto);
      const ur = await api.post('/api/upload/correction', pf, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.patch(`/api/violations/${id}`, { status: 'corrected', correction_url: ur.data.url });
      setCorrectionPhoto(null); setSelectedViolation(null); fetchViolations();
      alert('Correction proof uploaded successfully!');
    } catch (e) { console.error(e); alert('Failed to upload correction proof'); } finally { setUploading(false); }
  };

  const isOverdue = (d: string) => new Date(d) < new Date();

  const stats = {
    total: violations.length,
    pending: violations.filter(v => v.status === 'pending').length,
    corrected: violations.filter(v => v.status === 'corrected').length,
    verified: violations.filter(v => v.status === 'verified').length,
  };

  const isRepeatOffender = violations.some(v => v.is_repeat_offender);
  const highestWarningLevel = violations.reduce((max, v) => Math.max(max, v.warning_level || 1), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:bg-none dark:bg-slate-900 transition-colors duration-500 overflow-hidden relative font-['DM_Sans',sans-serif]">
      {/* Background orbs */}
      <div className="fixed top-[-20%] left-[-15%] w-[55%] h-[55%] rounded-full bg-white/10 dark:bg-indigo-500/20 blur-[80px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full bg-white/10 dark:bg-purple-500/20 blur-[80px] pointer-events-none z-0" />

      {/* Navbar */}
      <div className="relative z-10 border-b border-white/15 dark:border-white/5 bg-white/15 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 flex items-center justify-center shadow-lg shadow-black/10">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base tracking-tight">Student Dashboard</div>
              <div className="text-white/60 dark:text-slate-400 text-xs font-medium">Compliance Tracking Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <button onClick={signOut} className="flex items-center gap-2 bg-white/15 dark:bg-white/5 hover:bg-white/25 dark:hover:bg-white/10 text-white dark:text-slate-200 border border-white/20 dark:border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Profile Card */}
        <div className="bg-white/15 dark:bg-slate-800/80 border border-white/20 dark:border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-lg dark:shadow-none mb-8">
          <div className="flex gap-6 items-start flex-wrap">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
              <User size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h2 className="text-2xl font-black text-white dark:text-white m-0 tracking-tight">{userProfile?.full_name}</h2>
                {isRepeatOffender && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30">
                    <ShieldAlert size={12} /> Repeat Offender
                  </span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2">
                  <GraduationCap size={16} className="text-indigo-500" />
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">ID:</span>
                  <span className="text-slate-700 dark:text-slate-200 text-sm font-extrabold">{userProfile?.student_id}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2">
                  <Building2 size={16} className="text-indigo-500" />
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">Dept:</span>
                  <span className="text-slate-700 dark:text-slate-200 text-sm font-extrabold">{userProfile?.department}</span>
                </div>
              </div>

              {isRepeatOffender && highestWarningLevel >= 1 && (
                <div className={`mt-4 p-4 rounded-xl border flex gap-3 items-start ${highestWarningLevel >= 2 ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'}`}>
                  <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${highestWarningLevel >= 2 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  <div>
                    <p className={`text-sm font-extrabold m-0 mb-1 ${highestWarningLevel >= 2 ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {highestWarningLevel >= 2 ? 'Parent/Guardian Contact Required' : 'Warning Notice'}
                    </p>
                    <p className={`text-sm m-0 ${highestWarningLevel >= 2 ? 'text-rose-600/80 dark:text-rose-300/80' : 'text-amber-600/80 dark:text-amber-300/80'}`}>
                      {highestWarningLevel >= 2 ? 'You have 3 or more complaints. Your guardian will be contacted by the institution.' : 'You have received a formal warning. A 3rd complaint will result in a parent/guardian call.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Violations', value: stats.total, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20', Icon: AlertCircle },
            { label: 'Pending Action', value: stats.pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', Icon: Clock },
            { label: 'Submitted', value: stats.corrected, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', Icon: Upload },
            { label: 'Verified', value: stats.verified, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', Icon: CheckCircle },
          ].map(({ label, value, color, bg, border, Icon }) => (
            <div key={label} className={`relative overflow-hidden rounded-2xl p-6 border ${bg} ${border}`}>
              <div className={`absolute top-4 right-4 opacity-20 ${color}`}><Icon size={40} /></div>
              <div className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</div>
              <div className="text-slate-800 dark:text-white text-4xl font-black leading-none">{value}</div>
            </div>
          ))}
        </div>

        {/* Violations List */}
        <div className="bg-white/15 dark:bg-slate-800/80 border border-white/20 dark:border-white/5 rounded-2xl backdrop-blur-xl shadow-lg dark:shadow-none">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <AlertCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-slate-800 dark:text-white text-lg font-bold m-0">My Compliance Records</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">Loading…</div>
            ) : violations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <p className="text-emerald-600 dark:text-emerald-400 font-extrabold mb-1">All Clear!</p>
                <p className="text-emerald-500/70 dark:text-emerald-400/70 text-sm">No compliance violations recorded.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {violations.map((v) => {
                  const ss = getStatusStyle(v.status);
                  const ps = getPriorityStyle(v.priority);
                  const warnInfo = getWarningLevelInfo(v.warning_level);
                  const overdue = isOverdue(v.due_date) && v.status !== 'verified';
                  return (
                    <div key={v.id} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 rounded-2xl p-6 transition-colors">
                      <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <span className="text-slate-800 dark:text-white font-extrabold text-base">{v.student_id} — {v.student_name}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${ss}`}>{v.status}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${ps}`}>{v.priority}</span>
                            {v.is_repeat_offender && warnInfo && (
                              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${warnInfo.className}`}>
                                <AlertTriangle size={10} /> {warnInfo.label}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap mb-3">
                            <span className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1 text-xs text-slate-600 dark:text-slate-400 font-bold">{v.department}</span>
                            <span className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1 text-xs text-slate-600 dark:text-slate-400 font-bold">{v.category}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 p-4 bg-white dark:bg-white/5 rounded-xl">{v.description}</p>
                          <div className="flex gap-4 flex-wrap text-xs font-bold text-slate-500 dark:text-slate-500">
                            <span className="flex items-center gap-1.5"><Clock size={12} /> Reported: {new Date(v.created_at).toLocaleDateString()}</span>
                            <span className={`flex items-center gap-1.5 ${overdue ? 'text-rose-500' : ''}`}>
                              <AlertCircle size={12} /> Due: {new Date(v.due_date).toLocaleDateString()}{overdue ? ' (Overdue)' : ''}
                            </span>
                          </div>
                        </div>
                        {v.status === 'pending' && (
                          <button onClick={() => acknowledgeViolation(v.id)} className="shrink-0 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                            Acknowledge
                          </button>
                        )}
                      </div>

                      {v.is_repeat_offender && warnInfo && (
                        <div className={`mt-4 p-4 rounded-xl border flex gap-3 items-start ${warnInfo.className}`}>
                          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-extrabold block mb-0.5">Recommended Action: </span>
                            <span className="text-sm opacity-90">{v.recommended_action}</span>
                          </div>
                        </div>
                      )}

                      {(v.evidence_url || v.correction_url) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
                          {v.evidence_url && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800">
                              <div className="bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-white/10">Evidence</div>
                              <img src={v.evidence_url} alt="Evidence" className="w-full h-36 object-cover hover:scale-105 transition-transform" />
                            </div>
                          )}
                          {v.correction_url && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800">
                              <div className="bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-white/10">Correction</div>
                              <img src={v.correction_url} alt="Correction" className="w-full h-36 object-cover hover:scale-105 transition-transform" />
                            </div>
                          )}
                        </div>
                      )}

                      {(v.status === 'acknowledged' || v.status === 'correcting') && (
                        <div className="mt-4">
                          {selectedViolation?.id === v.id ? (
                            <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5 flex flex-col gap-4">
                              <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 rounded-xl p-5 text-center bg-white dark:bg-white/5">
                                <input type="file" accept="image/*" onChange={(e) => setCorrectionPhoto(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-500/20 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/30 cursor-pointer" />
                                <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-2">Upload your correction proof</p>
                              </div>
                              <div className="flex gap-3">
                                <button onClick={() => uploadCorrectionProof(v.id)} disabled={!correctionPhoto || uploading}
                                  className={`flex gap-2 items-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${(!correctionPhoto || uploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-200 dark:hover:bg-emerald-500/30'}`}>
                                  <Upload size={14} /> {uploading ? 'Uploading…' : 'Submit Correction'}
                                </button>
                                <button onClick={() => setSelectedViolation(null)} className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setSelectedViolation(v)} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                              <Upload size={14} /> Upload Correction Proof
                            </button>
                          )}
                        </div>
                      )}

                      {v.status === 'verified' && (
                        <div className="mt-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <div>
                            <span className="text-emerald-700 dark:text-emerald-400 text-sm font-extrabold block">Verified and Resolved</span>
                            <span className="text-emerald-600/70 dark:text-emerald-400/70 text-xs font-semibold">on {new Date(v.verified_at!).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}

                      {v.rejection_reason && (
                        <div className="mt-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
                          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-rose-700 dark:text-rose-400 text-sm font-extrabold block m-0 mb-1">Correction Rejected</span>
                            <span className="text-rose-600 dark:text-rose-300 text-sm block mb-1">Reason: {v.rejection_reason}</span>
                            <span className="text-rose-500/70 dark:text-rose-400/70 text-xs font-semibold">Please submit a new proof of correction.</span>
                          </div>
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