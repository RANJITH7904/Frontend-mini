import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Violation, VIOLATION_CATEGORIES, RepeatOffenderSummary } from '../types/database';
import { AlertCircle, Clock, CheckCircle, XCircle, LogOut, Shield, Search, Download, AlertTriangle, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';

// --- REPEATED VIOLATION TRACKING: Helper to style warning level badge ---
// Business Rules (total complaints per student, any category):
//   level 0 → Excused    (1st complaint)
//   level 1 → Warning    (2nd complaint)
//   level 2 → Meet the Parent (3rd+ complaint)
function getWarningLevelBadge(level?: number) {
  switch (level) {
    case 0:
      return { label: 'Excused', className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600' };
    case 1:
      return { label: 'Warning', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-700' };
    default:
      if (level !== undefined && level >= 2)
        return { label: 'Meet the Parent', className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-400 dark:border-rose-700' };
      return { label: 'Excused', className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600' };
  }
}
// --- END REPEATED VIOLATION TRACKING HELPER ---

export default function AdminDashboard() {
  const { userProfile, signOut } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
    // --- REPEATED VIOLATION TRACKING: filter for repeat offenders only ---
    repeatOnly: false,
    // --- END REPEATED VIOLATION TRACKING FILTER ---
  });
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // --- REPEATED VIOLATION TRACKING: separate state for repeat offenders panel ---
  const [activeTab, setActiveTab] = useState<'all' | 'repeat-offenders'>('all');
  const [repeatOffenders, setRepeatOffenders] = useState<RepeatOffenderSummary[]>([]);
  const [repeatLoading, setRepeatLoading] = useState(false);
  // --- END REPEATED VIOLATION TRACKING STATE ---

  useEffect(() => {
    fetchViolations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [violations, filters]);

  // --- REPEATED VIOLATION TRACKING: fetch repeat offenders when tab switches ---
  useEffect(() => {
    if (activeTab === 'repeat-offenders') {
      fetchRepeatOffenders();
    }
  }, [activeTab]);
  // --- END REPEATED VIOLATION TRACKING EFFECT ---

  const fetchViolations = async () => {
    try {
      const response = await api.get('/api/violations');
      setViolations(response.data || []);
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- REPEATED VIOLATION TRACKING: Fetch repeat offenders from dedicated endpoint ---
  const fetchRepeatOffenders = async () => {
    setRepeatLoading(true);
    try {
      const response = await api.get('/api/violations/repeat-offenders');
      setRepeatOffenders(response.data || []);
    } catch (error) {
      console.error('Error fetching repeat offenders:', error);
    } finally {
      setRepeatLoading(false);
    }
  };
  // --- END REPEATED VIOLATION TRACKING FETCH ---

  const applyFilters = () => {
    let filtered = [...violations];

    if (filters.status !== 'all') {
      filtered = filtered.filter((v) => v.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter((v) => v.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.student_id.toLowerCase().includes(searchLower) ||
          v.student_name.toLowerCase().includes(searchLower) ||
          v.department.toLowerCase().includes(searchLower)
      );
    }

    // --- REPEATED VIOLATION TRACKING: Filter for repeat offenders only ---
    if (filters.repeatOnly) {
      filtered = filtered.filter((v) => v.is_repeat_offender);
    }
    // --- END REPEATED VIOLATION TRACKING FILTER ---

    setFilteredViolations(filtered);
  };

  const verifyViolation = async (violationId: string) => {
    try {
      await api.patch(`/api/violations/${violationId}`, {
        status: 'verified',
      });
      fetchViolations();
      setSelectedViolation(null);
      alert('Violation verified successfully!');
    } catch (error) {
      console.error('Error verifying violation:', error);
      alert('Failed to verify violation');
    }
  };

  const rejectViolation = async (violationId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await api.patch(`/api/violations/${violationId}`, {
        status: 'correcting',
        rejection_reason: rejectionReason,
      });
      fetchViolations();
      setSelectedViolation(null);
      setRejectionReason('');
      alert('Correction rejected. Student will need to resubmit.');
    } catch (error) {
      console.error('Error rejecting violation:', error);
      alert('Failed to reject violation');
    }
  };

  // --- REPEATED VIOLATION TRACKING: Admin marks escalation as actioned ---
  const markEscalationActioned = async (violationId: string) => {
    try {
      await api.patch(`/api/violations/${violationId}`, {
        escalation_status: 'actioned',
      });
      fetchViolations();
      alert('Escalation marked as actioned.');
    } catch (error) {
      console.error('Error marking escalation actioned:', error);
      alert('Failed to update escalation status');
    }
  };
  // --- END REPEATED VIOLATION TRACKING ACTION ---

  const exportData = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      // --- REPEATED VIOLATION TRACKING: Include new fields in CSV export ---
      const headers = ['ID', 'Student ID', 'Student Name', 'Department', 'Category', 'Status', 'Priority', 'Repeat Count', 'Warning Level', 'Recommended Action', 'Escalation Status', 'Created Date', 'Due Date'];
      const rows = filteredViolations.map((v) => [
        v.id,
        v.student_id,
        v.student_name,
        v.department,
        v.category,
        v.status,
        v.priority,
        v.repeat_count ?? 1,
        v.warning_level ?? 1,
        v.recommended_action ?? 'Warning',
        v.escalation_status ?? 'none',
        new Date(v.created_at).toLocaleDateString(),
        new Date(v.due_date).toLocaleDateString(),
      ]);
      // --- END REPEATED VIOLATION TRACKING CSV FIELDS ---

      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const jsonContent = JSON.stringify(filteredViolations, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      case 'correcting':
        return 'bg-orange-100 text-orange-800';
      case 'corrected':
        return 'bg-purple-100 text-purple-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: violations.length,
    pending: violations.filter((v) => v.status === 'pending').length,
    corrected: violations.filter((v) => v.status === 'corrected').length,
    verified: violations.filter((v) => v.status === 'verified').length,
    // --- REPEATED VIOLATION TRACKING: count violations needing escalation attention ---
    pendingEscalations: violations.filter((v) => v.escalation_status === 'pending').length,
    // --- END REPEATED VIOLATION TRACKING STAT ---
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:bg-none dark:bg-slate-900 transition-colors duration-500 overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 dark:bg-purple-600/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/5 dark:bg-pink-600/5 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
              <p className="text-purple-100 text-sm font-medium opacity-90">Compliance Tracking Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm hidden sm:block">Admin: <span className="font-bold">{userProfile?.full_name}</span></span>
            <DarkModeToggle />
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/25 backdrop-blur-md px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid - now 5 cards including escalations */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-500/40 border border-blue-400/20">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <AlertCircle className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 font-medium">Total</span>
              </div>
              <p className="text-5xl font-black">{stats.total}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-500/40 border border-orange-400/20">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-100 font-medium">Pending</span>
              </div>
              <p className="text-5xl font-black">{stats.pending}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/40 border border-purple-400/20">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <AlertCircle className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100 font-medium">Awaiting Verify</span>
              </div>
              <p className="text-5xl font-black">{stats.corrected}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/40 border border-emerald-400/20">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <CheckCircle className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-100 font-medium">Verified</span>
              </div>
              <p className="text-5xl font-black">{stats.verified}</p>
            </div>
          </div>

          {/* --- REPEATED VIOLATION TRACKING: Pending Escalations stat card --- */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/20 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-rose-500/40 border border-rose-400/20">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-rose-100 font-medium">Escalations</span>
              </div>
              <p className="text-5xl font-black">{stats.pendingEscalations}</p>
            </div>
          </div>
          {/* --- END REPEATED VIOLATION TRACKING STAT CARD --- */}
        </div>

        {/* --- REPEATED VIOLATION TRACKING: Tab switcher for All Violations / Repeat Offenders --- */}
        <div className="flex gap-3 mb-8 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Shield className="w-4 h-4" />
            All Compliance Records
          </button>
          <button
            onClick={() => setActiveTab('repeat-offenders')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'repeat-offenders' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <ShieldAlert className="w-4 h-4" />
            Repeat Offenders
            {stats.pendingEscalations > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'repeat-offenders' ? 'bg-white text-rose-600' : 'bg-rose-500 text-white shadow-sm'}`}>
                {stats.pendingEscalations}
              </span>
            )}
          </button>
        </div>
        {/* --- END REPEATED VIOLATION TRACKING TAB SWITCHER --- */}

        {activeTab === 'all' && (
          <>
            {/* Filters */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 mb-8 overflow-hidden transition-all duration-300">
              <div className="px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-500" /> Filter Compliances
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => exportData('csv')}
                    className="flex items-center gap-2 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 dark:hover:bg-emerald-500/20 px-4 py-2 rounded-xl transition-colors font-bold border border-emerald-500/20 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="flex items-center gap-2 bg-blue-600/10 text-blue-700 dark:text-blue-400 hover:bg-blue-600/20 dark:hover:bg-blue-500/20 px-4 py-2 rounded-xl transition-colors font-bold border border-blue-500/20 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white shadow-sm transition-all duration-200 outline-none appearance-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="correcting">Correcting</option>
                      <option value="corrected">Corrected</option>
                      <option value="verified">Verified</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white shadow-sm transition-all duration-200 outline-none appearance-none"
                    >
                      <option value="all">All Categories</option>
                      {VIOLATION_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      Search Student
                    </label>
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white shadow-sm transition-all duration-200 outline-none placeholder:text-slate-400"
                        placeholder="Search by ID, name, or dept."
                      />
                    </div>
                  </div>

                  {/* --- REPEATED VIOLATION TRACKING: Repeat Offender filter toggle --- */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                      Focus Area
                    </label>
                    <button
                      onClick={() => setFilters({ ...filters, repeatOnly: !filters.repeatOnly })}
                      className={`w-full px-4 py-3 rounded-xl border font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        filters.repeatOnly
                          ? 'bg-rose-600 text-white border-rose-600 shadow-rose-500/30 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:border-rose-300 dark:hover:border-rose-700/50 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      {filters.repeatOnly ? <><ShieldAlert className="w-4 h-4" /> Showing Repeat Only</> : 'Show All'}
                    </button>
                  </div>
                  {/* --- END REPEATED VIOLATION TRACKING FILTER --- */}
                </div>
              </div>
            </div>

            {/* Records list */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50">
              <div className="px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Compliance Records</h2>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/50">
                  Showing {filteredViolations.length} of {violations.length}
                </span>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="w-8 h-8 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 dark:border-t-purple-500 animate-spin" />
                  </div>
                ) : filteredViolations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
                      <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Records Found</h3>
                    <p className="text-slate-500 dark:text-slate-400">No compliance records matching your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {filteredViolations.map((violation) => {
                      // --- REPEATED VIOLATION TRACKING: Get badge for each violation ---
                      const warnBadge = getWarningLevelBadge(violation.warning_level);
                      // --- END REPEATED VIOLATION TRACKING ---
                      return (
                        <div
                          key={violation.id}
                          className="group bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 hover:shadow-lg dark:hover:shadow-lg hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {violation.student_id} - {violation.student_name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(violation.status)}`}>
                                  {violation.status}
                                </span>

                                {/* --- REPEATED VIOLATION TRACKING: Admin sees repeat offender badge + count --- */}
                                {violation.is_repeat_offender && (
                                  <>
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${warnBadge.className}`}>
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      {warnBadge.label}
                                    </span>
                                    <span className="px-3 py-1 bg-slate-200/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">
                                      Offense #{violation.repeat_count}
                                    </span>
                                  </>
                                )}
                                {/* --- END REPEATED VIOLATION TRACKING BADGES --- */}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                  <span className="text-slate-500 font-medium text-sm">Dept:</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{violation.department}</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                  <span className="text-slate-500 font-medium text-sm">Category:</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{violation.category}</span>
                                </div>
                              </div>

                              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm mb-4">
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{violation.description}</p>
                              </div>

                              {/* --- REPEATED VIOLATION TRACKING: Escalation info + action button for admin --- */}
                              {violation.is_repeat_offender && (
                                <div className={`mt-2 mb-4 p-4 border rounded-xl flex items-center justify-between gap-4 flex-wrap ${
                                  violation.escalation_status === 'actioned'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
                                    : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${violation.escalation_status === 'actioned' ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
                                    <div>
                                      <span className={`text-sm font-bold block mb-1 ${violation.escalation_status === 'actioned' ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'}`}>
                                        Recommended Action: {violation.recommended_action}
                                      </span>
                                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold border ${
                                        violation.escalation_status === 'actioned'
                                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
                                          : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50'
                                      }`}>
                                        {violation.escalation_status === 'actioned' ? <><CheckCircle className="w-3 h-3" /> Actioned</> : 'Needs Attention'}
                                      </span>
                                    </div>
                                  </div>
                                  {violation.escalation_status === 'pending' && (
                                    <button
                                      onClick={() => markEscalationActioned(violation.id)}
                                      className="text-sm bg-rose-600 text-white px-5 py-2.5 rounded-xl hover:bg-rose-700 transition-colors font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transform flex-shrink-0"
                                    >
                                      Mark Actioned
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* --- END REPEATED VIOLATION TRACKING ESCALATION PANEL --- */}

                              <div className="flex flex-wrap items-center gap-4.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-4 bg-slate-100 dark:bg-slate-800 max-w-fit px-4 py-2 rounded-lg">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Rep: {new Date(violation.created_at).toLocaleDateString()}</span>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Due: {new Date(violation.due_date).toLocaleDateString()}</span>
                                {violation.acknowledged_at && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><CheckCircle className="w-3.5 h-3.5" /> Ack: {new Date(violation.acknowledged_at).toLocaleDateString()}</span>
                                  </>
                                )}
                                {violation.corrected_at && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                    <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400"><CheckCircle className="w-3.5 h-3.5" /> Cor: {new Date(violation.corrected_at).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            {violation.evidence_url && (
                              <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Evidence Photo</p>
                                </div>
                                <img
                                  src={violation.evidence_url}
                                  alt="Evidence"
                                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                                />
                              </div>
                            )}

                            {violation.correction_url && (
                              <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Correction Proof</p>
                                </div>
                                <img
                                  src={violation.correction_url}
                                  alt="Correction"
                                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>

                          {violation.status === 'corrected' && (
                            <div className="mt-5">
                              {selectedViolation?.id === violation.id ? (
                                <div className="space-y-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-purple-200 dark:border-purple-800/50 shadow-inner">
                                  <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                      Rejection Reason <span className="text-rose-500">(if rejecting)</span>
                                    </label>
                                    <textarea
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white shadow-sm transition-all duration-200 outline-none placeholder:text-slate-400"
                                      rows={2}
                                      placeholder="Explain why this correction is insufficient..."
                                    />
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <button
                                      onClick={() => verifyViolation(violation.id)}
                                      className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:-translate-y-0.5"
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => rejectViolation(violation.id)}
                                      className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl hover:bg-rose-700 transition-colors font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transform hover:-translate-y-0.5"
                                    >
                                      <XCircle className="w-5 h-5" />
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedViolation(null);
                                        setRejectionReason('');
                                      }}
                                      className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setSelectedViolation(violation)}
                                  className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-colors font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                  <Shield className="w-4 h-4" />
                                  Review Correction
                                </button>
                              )}
                            </div>
                          )}

                          {violation.status === 'verified' && (
                            <div className="mt-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-sm">Verified and Resolved</span>
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                                  on {new Date(violation.verified_at!).toLocaleDateString()}
                                </span>
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
          </>
        )}

        {/* --- REPEATED VIOLATION TRACKING: Repeat Offenders Tab Panel --- */}
        {activeTab === 'repeat-offenders' && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-rose-200/50 dark:border-rose-900/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-rose-200/50 dark:border-rose-900/50 flex items-center gap-3 bg-rose-50/50 dark:bg-rose-900/20">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100">Repeat Offenders Protocol</h2>
                <p className="text-sm font-medium text-rose-700/80 dark:text-rose-300/80">
                  Priority attention required for students with multiple identical violations
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
              {repeatLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 rounded-full border-4 border-rose-200 dark:border-rose-900 border-t-rose-600 dark:border-t-rose-500 animate-spin" />
                </div>
              ) : repeatOffenders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">All Clear</h3>
                  <p className="text-slate-500 dark:text-slate-400">No active repeat offenders requiring escalation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {repeatOffenders.map((student) => {
                    const badge = getWarningLevelBadge(student.max_warning_level);
                    return (
                      <div
                        key={student.student_id}
                        className="bg-white dark:bg-slate-800 border-2 border-rose-100 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Student summary header */}
                        <div className="flex items-start justify-between mb-5 flex-wrap gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 rounded-2xl border border-rose-100 dark:border-rose-800/50 flex items-center justify-center shadow-inner">
                              <Users className="w-7 h-7 text-rose-500 dark:text-rose-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">{student.student_name}</h3>
                                <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${badge.className}`}>
                                  <AlertTriangle className="w-3 h-3" />
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{student.student_id}</span>
                                <span>{student.department}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-800/50">
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">Total Infractions</p>
                            <p className="text-3xl font-black text-rose-600 dark:text-rose-500 leading-none">{student.violations.length}</p>
                          </div>
                        </div>

                        {/* Violations list for this student */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Incident History</h4>
                          {student.violations.map((v) => (
                            <div
                              key={v.id}
                              className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors hover:border-rose-300 dark:hover:border-rose-700"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="font-bold text-sm text-slate-800 dark:text-white">
                                      {v.category}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${getStatusColor(v.status)}`}>
                                      {v.status}
                                    </span>
                                    <span className="text-xs font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                      #{v.repeat_count}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(v.created_at).toLocaleDateString()}
                                    <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                                    <span className="text-rose-600 dark:text-rose-400">{v.recommended_action}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {v.escalation_status === 'pending' && (
                                    <button
                                      onClick={() => markEscalationActioned(v.id)}
                                      className="text-xs bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5 font-bold"
                                    >
                                      Mark Actioned
                                    </button>
                                  )}
                                  {v.escalation_status === 'actioned' && (
                                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5" /> Actioned
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {/* --- END REPEATED VIOLATION TRACKING PANEL --- */}
      </div>
    </div>
  );
}
