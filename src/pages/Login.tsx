import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Users, Shield } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'staff' | 'admin'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error(err);
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
        { top: '15%', left: '8%' }, { top: '40%', left: '4%' }, { top: '70%', left: '12%' },
        { top: '20%', right: '8%' }, { top: '55%', right: '5%' }, { top: '80%', right: '14%' },
        { top: '10%', left: '30%' }, { top: '88%', right: '30%' },
      ].map((pos, i) => (
        <div key={i} className="absolute text-white/60 text-xl pointer-events-none select-none" style={pos}>
          {i % 2 === 0 ? '✦' : '✧'}
        </div>
      ))}

      {/* Main layout: centered card */}
      <div className="relative z-10 w-full max-w-md mx-auto">


        {/* Login Card */}
        <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-white/10 p-8 w-full max-w-md z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">College Login</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Select your role and enter credentials</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-7">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id as typeof selectedRole)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 shadow-md shadow-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-1.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Username</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white text-sm shadow-sm transition-all outline-none placeholder:text-slate-400"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white text-sm shadow-sm transition-all outline-none placeholder:text-slate-400"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-70 transform hover:-translate-y-0.5"
            >
              {loading ? 'Signing In...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-700 pt-5">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Don't have an account?{' '}
              <a href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold hover:underline transition-colors">
                Register
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
