import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { Profile } from '../types';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const savedUser = localStorage.getItem('cybersoc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Fetch latest profile settings from database
      api.profile.get(parsedUser.id)
        .then(profileData => {
          setProfile(profileData);
        })
        .catch(err => {
          console.error("Failed to load user profile settings:", err);
          setProfile(parsedUser);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const response = await api.auth.login({ email, password });
      const userData = response.user;
      setUser(userData);
      
      // Fetch user profile from DB after successful login
      try {
        const profileData = await api.profile.get(userData.id);
        setProfile(profileData);
      } catch (e) {
        setProfile(userData);
      }

      localStorage.setItem('cybersoc_user', JSON.stringify(userData));
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const response = await api.auth.signup({ email, password, full_name: fullName });
      const userData = response.user;
      setUser(userData);
      
      // Fetch user profile from DB after successful signup
      try {
        const profileData = await api.profile.get(userData.id);
        setProfile(profileData);
      } catch (e) {
        setProfile(userData);
      }

      localStorage.setItem('cybersoc_user', JSON.stringify(userData));
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }

  async function signOut() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('cybersoc_user');
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: { message: 'User not authenticated' } };
    try {
      const updatedProfile = await api.profile.update(user.id, updates);
      setProfile(updatedProfile);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
