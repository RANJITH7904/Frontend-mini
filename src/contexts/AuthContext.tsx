import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../lib/api';
import { User } from '../types/database';

interface AuthContextType {
  user: User | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Validate token by fetching fresh profile
          const response = await api.get('/api/auth/profile');
          const freshUser: User = response.data.user;
          setUser(freshUser);
          setUserProfile(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          // Token invalid or expired — clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setUserProfile(userData);
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      full_name: userData.full_name,
      role: userData.role,
      student_id: userData.student_id,
      department: userData.department,
    });

    const { token, user: newUser } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setUserProfile(newUser);
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
