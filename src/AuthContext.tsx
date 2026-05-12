import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { UserProfile } from './types';
import { loginWithGoogle, logoutUser } from './auth';

type AuthType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogleAdmin: () => Promise<boolean>;
  loginWithPin: (pin: string) => boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
  user: null,
  loading: true,
  isAdmin: false,
  loginWithGoogleAdmin: async () => false,
  loginWithPin: () => false,
  logout: async () => {}
});

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if we are in a Supabase OAuth popup redirect
    // If so, notify the parent and close the window
    if (typeof window !== 'undefined' && window.opener && (window.location.hash.includes('access_token=') || window.location.search.includes('code='))) {
       // Optional: We can wait for session to be fully ready if needed, 
       // but closing the window is often enough as the parent iframe will detect session via onAuthStateChange
       window.close();
    }

    // Initial eager check
    const checkSession = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session) {
          await handleSessionChange(session);
        } else {
          setLoading(false);
        }
      } catch (e: any) {
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
          console.warn("[Supabase] Auth Connection Failure: Service unreachable or unconfigured.");
        } else {
          console.error("Session check error:", e);
        }
        setLoading(false);
      }
    };

    checkSession();
    
    // Supabase Auth Listener
    let subscription: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          await handleSessionChange(session);
        } else {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleSessionChange = async (session: any) => {
    if (!session) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    const { user: supaUser } = session;
    
    try {
      // Fetch profile from 'profiles' table
      // We rely on the DB trigger to have created this profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .single();

      if (profile) {
        setUser({ id: supaUser.id, ...profile } as any);
        // Sync Admin state if the role is admin in database
        if (profile.role === 'admin') setIsAdmin(true);
      } else if (error && error.code === 'PGRST116') {
        // If profile doesn't exist yet (trigger might be slow), create a minimal one
        const fallbackProfile = {
          id: supaUser.id,
          name: supaUser.user_metadata.full_name || supaUser.email?.split('@')[0] || 'User',
          email: supaUser.email || '',
          role: 'customer'
        };
        
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .upsert(fallbackProfile)
          .select()
          .single();
          
        if (!createError && created) {
          setUser(created as any);
        }
      }
    } catch (err: any) {
      console.error("[Auth] Profile Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetInactivityTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isAdmin) {
      timeoutRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      resetInactivityTimer();
    }
  }, [isAdmin]);

  const loginWithGoogleAdmin = async () => {
    await loginWithGoogle();
    return true;
  };

  const loginWithPin = (pin: string) => {
    // Legacy support for Pin login while transitioning to full RLS
    // In production, this should check a secure hash or be removed entirely
    if (pin === "8585") {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await logoutUser();
    setIsAdmin(false);
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_last_active');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        loginWithGoogleAdmin,
        loginWithPin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
