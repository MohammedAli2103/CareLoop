import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdminOtpVerified: boolean;
  setAdminOtpVerified: (verified: boolean) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  setDemoUser: (profile: Partial<Profile> & { role: Profile['role'] }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdminOtpVerified, setIsAdminOtpVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('careloop_admin_otp_verified') === 'true';
  });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // User exists in auth but no profile row yet
        console.warn('Profile not found for authenticated user:', error?.message);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Check if a demo session was stored
      const savedDemo = sessionStorage.getItem('careloop_demo_user');
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          setProfile(parsed);
          setUser({ id: parsed.id, email: parsed.email } as any);
        } catch (e) {
          console.error(e);
        }
      }
      setIsLoading(false);
      return;
    }

    // Initialize Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setIsAdminOtpVerified(false);
          sessionStorage.removeItem('careloop_admin_otp_verified');
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSetAdminOtpVerified = (verified: boolean) => {
    setIsAdminOtpVerified(verified);
    if (verified) {
      sessionStorage.setItem('careloop_admin_otp_verified', 'true');
    } else {
      sessionStorage.removeItem('careloop_admin_otp_verified');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      sessionStorage.removeItem('careloop_demo_user');
      sessionStorage.removeItem('careloop_admin_otp_verified');
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdminOtpVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoUser = (customProfile: Partial<Profile> & { role: Profile['role'] }) => {
    const fullProfile: Profile = {
      id: customProfile.id || 'demo-admin-id',
      role: customProfile.role,
      status: customProfile.status || 'active',
      full_name: customProfile.full_name || 'CareLoop Administrator',
      email: customProfile.email || 'admin@careloop.com',
      phone: customProfile.phone || '+1 555-0100',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProfile(fullProfile);
    setUser({ id: fullProfile.id, email: fullProfile.email } as any);
    sessionStorage.setItem('careloop_demo_user', JSON.stringify(fullProfile));
    if (customProfile.role === 'admin') {
      handleSetAdminOtpVerified(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdminOtpVerified,
        setAdminOtpVerified: handleSetAdminOtpVerified,
        refreshProfile,
        signOut,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
