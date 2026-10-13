
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOtpVerified, setIsAdminOtpVerified] = useState(
    () => sessionStorage.getItem('careloop_admin_otp_verified') === 'true'
  );

  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    // Never retain a profile belonging to a previous account.
    setProfile(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, status, full_name, email, phone, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile query failed:', {
          userId,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
      }

      if (!data) {
        console.error(
          `[Auth] No visible profile found for authenticated user ${userId}. ` +
          'Check that profiles.id matches auth.users.id and review SELECT RLS policies.'
        );
        return;
      }

      if (data.status !== 'active') {
        console.error('[Auth] Account is not active:', {
          userId,
          status: data.status,
        });
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('[Auth] Unexpected profile lookup error:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured()) {
      const savedDemo = sessionStorage.getItem('careloop_demo_user');

      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo) as Profile;
          if (mounted) {
            setProfile(parsed);
            setUser({ id: parsed.id, email: parsed.email } as User);
          }
        } catch (error) {
          console.error('[Auth] Could not restore demo user:', error);
        }
      }

      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    // Register the listener before loading the initial session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setIsAdminOtpVerified(false);
        sessionStorage.removeItem('careloop_admin_otp_verified');
        setIsLoading(false);
        return;
      }

      // Defer the Supabase query until after the auth callback completes.
      const userId = nextSession.user.id;
      setProfile(null);

      setTimeout(() => {
        if (mounted) {
          void fetchProfile(userId).finally(() => {
            if (mounted) setIsLoading(false);
          });
        }
      }, 0);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('[Auth] Failed to load session:', error.message);
      }

      const currentSession = data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        void fetchProfile(currentSession.user.id).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleSetAdminOtpVerified = (verified: boolean) => {
    setIsAdminOtpVerified(verified);

    if (verified) {
      sessionStorage.setItem('careloop_admin_otp_verified', 'true');
    } else {
      sessionStorage.removeItem('careloop_admin_otp_verified');
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      sessionStorage.removeItem('careloop_demo_user');
      sessionStorage.removeItem('careloop_admin_otp_verified');

      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdminOtpVerified(false);
    } catch (error) {
      console.error('[Auth] Sign-out failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoUser = (
    customProfile: Partial<Profile> & { role: Profile['role'] }
  ) => {
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
    setUser({ id: fullProfile.id, email: fullProfile.email } as User);
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
