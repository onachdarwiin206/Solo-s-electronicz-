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
    if (typeof window !== 'undefined' && window.opener && (window.location.hash.includes('access_token=') || window.location.search.includes('code='))) {
       window.close();
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isInitialized = false;

    // First, check the current session immediately
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleSessionChange(session);
        } else {
          setLoading(false);
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("[Auth] Init Error:", e);
        setLoading(false);
      } finally {
        isInitialized = true;
      }
    };

    initAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event}`);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        sessionStorage.removeItem('auth_redirect_pending');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session) {
          setLoading(true);
          await handleSessionChange(session);
        }
      } else if (event === 'INITIAL_SESSION') {
         if (!session && isInitialized) {
            setLoading(false);
            setIsAdmin(false);
         }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSessionChange = async (session: any) => {
    if (!session) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { user: supaUser } = session;
    
    try {
      // 1. Fetch profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .maybeSingle();

      // 2. Check explicitly if email is in 'admins' table as requested
      const { data: adminRow } = await supabase
        .from('admins')
        .select('id')
        .eq('email', supaUser.email)
        .maybeSingle();

      const isUserAdmin = (profile?.role === 'admin') || !!adminRow;

      if (profile) {
        setUser({ id: supaUser.id, ...profile } as any);
        setIsAdmin(isUserAdmin);
      } else {
        // Create profile if missing
        const fallbackProfile = {
          id: supaUser.id,
          name: supaUser.user_metadata.full_name || supaUser.email?.split('@')[0] || 'User',
          email: supaUser.email || '',
          role: isUserAdmin ? 'admin' : 'customer'
        };
        
        await supabase.from('profiles').upsert(fallbackProfile);
        setUser({ ...fallbackProfile } as any);
        setIsAdmin(isUserAdmin);
      }
    } catch (err: any) {
      console.error("[Auth] Profile Sync Exception:", err.message);
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
