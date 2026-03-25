import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { user, userProfile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/register') {
      setCurrentPage('register');
    } else if (path === '/login' || path === '/') {
      setCurrentPage('login');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/register') {
        setCurrentPage('register');
      } else {
        setCurrentPage('login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (href === '/register' || href === '/login') {
          e.preventDefault();
          const newPage = href === '/register' ? 'register' : 'login';
          setCurrentPage(newPage);
          window.history.pushState({}, '', href);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-white/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-400/10 blur-[100px] pointer-events-none" />

        {/* Spinner */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-b-white/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-white/90 font-semibold text-lg tracking-wide animate-pulse">Loading&hellip;</p>
      </div>
    );
  }

  if (!user || !userProfile) {
    return currentPage === 'register' ? <Register /> : <Login />;
  }

  switch (userProfile.role) {
    case 'student':
      return <StudentDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Login />;
  }
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
