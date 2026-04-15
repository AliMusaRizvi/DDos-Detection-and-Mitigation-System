import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { clearEmergencySession, EmergencySession, readEmergencySession, writeEmergencySession } from '../lib/authFallback';

type AppRole = 'admin' | 'user';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: any | null;
  role: AppRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  activateEmergencySession: (session: EmergencySession) => void;
};

const adminRoles = new Set(['superadmin', 'admin', 'analyst']);
const AUTH_TIMEOUT_MS = 10000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const mapToAppRole = (role: unknown): AppRole => {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return adminRoles.has(normalizedRole) ? 'admin' : 'user';
};

const getUserFallbackRole = (authUser: User): AppRole => {
  const metadataRole = authUser.user_metadata?.role ?? authUser.app_metadata?.role;
  return mapToAppRole(metadataRole);
};

const createEmergencyUser = (email: string, fullName: string, role: AppRole): User => ({
  id: 'emergency-admin',
  aud: 'authenticated',
  email,
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    full_name: fullName,
    role: role === 'admin' ? 'superadmin' : 'viewer',
  },
  created_at: new Date().toISOString(),
} as User);

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
  activateEmergencySession: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activateEmergencySession = (emergencySession: EmergencySession) => {
    writeEmergencySession(emergencySession.email, emergencySession.role, emergencySession.full_name);
    setSession(null);
    setProfile({
      full_name: emergencySession.full_name,
      role: emergencySession.role === 'admin' ? 'superadmin' : 'viewer',
    });
    setRole(emergencySession.role);
    setUser(createEmergencyUser(emergencySession.email, emergencySession.full_name, emergencySession.role));
    setIsLoading(false);
  };

  const fetchProfile = async (authUser: User) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('ddos_profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle(),
        AUTH_TIMEOUT_MS,
        'Profile lookup',
      );

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setProfile(null);
        setRole(getUserFallbackRole(authUser));
        return;
      }

      setProfile(data || null);
      setRole(mapToAppRole(data?.role ?? authUser.user_metadata?.role ?? authUser.app_metadata?.role));
    } catch (error) {
      console.error('Profile fetch failed:', error);
      setProfile(null);
      setRole(getUserFallbackRole(authUser));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        const emergencySession = readEmergencySession();
        if (emergencySession) {
          activateEmergencySession(emergencySession);
          return;
        }

        setProfile(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      await fetchProfile(nextUser);
    };

    const initializeSession = async () => {
      setIsLoading(true);
      const { data, error } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_TIMEOUT_MS,
        'Session initialization',
      );

      if (error) {
        console.error('Error fetching initial session:', error);
      }

      await syncAuthState(data.session ?? null);
    };

    void initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await syncAuthState(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      clearEmergencySession();
      setProfile(null);
      setRole(null);
      setUser(null);
      setSession(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isLoading, signOut, activateEmergencySession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
