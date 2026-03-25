import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Users, Shield, Eye, EyeOff } from 'lucide-react';
import { DEPARTMENTS } from '../types/database';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student' as 'student' | 'staff' | 'admin',
    studentId: '',
    department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.role === 'student' && (!formData.studentId || !formData.department)) {
      setError('Student ID and Department are required for students'); return;
    }
    setLoading(true);
    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        role: formData.role,
        student_id: formData.role === 'student' ? formData.studentId : undefined,
        department: formData.role === 'student' ? formData.department : undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:bg-none dark:bg-slate-900 transition-colors duration-500">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 dark:bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 dark:bg-purple-600/10 blur-[100px] pointer-events-none" />

      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4 z-50">
        <DarkModeToggle />
      </div>

      {/* Sparkle stars */}
      {[
        { top: '12%', left: '6%' }, { top: '45%', left: '3%' }, { top: '75%', left: '10%' },
        { top: '25%', right: '7%' }, { top: '60%', right: '4%' }, { top: '85%', right: '12%' },
        { top: '8%', left: '28%' }, { top: '90%', right: '28%' },
      ].map((pos, i) => (
        <div key={i} className="absolute text-white/60 text-xl pointer-events-none select-none" style={pos}>
          {i % 2 === 0 ? '✦' : '✧'}
        </div>
      ))}

      {/* Main layout: centered card */}
      <div className="relative z-10 w-full max-w-md mx-auto">


        {/* Register Card */}
        <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-white/10 p-8 w-full max-w-md z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Join the college portal today</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = formData.role === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.id as typeof formData.role })}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 shadow-md shadow-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {formData.role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="e.g., STU001"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select dept</option>
                    {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-70 transform hover:-translate-y-0.5 mt-1"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center border-t border-slate-200 dark:border-slate-700 pt-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold hover:underline transition-colors">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
      `}</style>
    </div>
  );
}