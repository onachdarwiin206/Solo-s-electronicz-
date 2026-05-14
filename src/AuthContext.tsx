import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { UserProfile } from './types';
import { loginWithGoogle, logoutUser } from './auth';

type AuthType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isRecovering: boolean;
  clearRecoveryState: () => void;
  loginWithGoogleAdmin: () => Promise<boolean>;
  loginWithPin: (pin: string) => boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
  user: null,
  loading: true,
  isAdmin: false,
  isRecovering: false,
  clearRecoveryState: () => {},
  loginWithGoogleAdmin: async () => false,
  loginWithPin: () => false,
  logout: async () => {}
});

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
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
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
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
    const ownerEmail = 'onachdarwiin@gmail.com'.toLowerCase();
    const currentEmail = supaUser.email?.toLowerCase();
    
    try {
      console.log(`[Auth] 🔍 Verifying Identity for: ${currentEmail}`);
      
      // 1. Check explicitly if email is in 'admins' table OR is the owner
      const isOwner = currentEmail === ownerEmail;
      let isAdminByTable = false;

      const { data: adminRow, error: adminError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', supaUser.email)
        .maybeSingle();

      if (adminError) {
        console.warn("[Auth] Admins table check failed:", adminError.message);
      } else if (adminRow) {
        isAdminByTable = true;
      }

      // 2. Fetch or Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .maybeSingle();

      const isUserAdmin = (profile?.role === 'admin') || isAdminByTable || isOwner;
      console.log(`[Auth] 🛡️ Permissions: Admin=${isUserAdmin}, Owner=${isOwner}`);

      if (profileError) {
         console.error("[Auth] Profiles query failed:", profileError);
      }

      if (profile) {
        // Sync role if it changed or if owner, but handle RLS failures gracefully
        if (isUserAdmin && profile.role !== 'admin') {
          try {
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', supaUser.id);
          } catch (e) {
            console.warn("[Auth] Role update failed (likely RLS), using in-memory elevation.");
          }
          setUser({ id: supaUser.id, ...profile, role: 'admin' } as any);
        } else {
          setUser({ id: supaUser.id, ...profile } as any);
        }
        setIsAdmin(isUserAdmin);
      } else {
        // Create profile if missing
        console.log("[Auth] 🆕 Creating new hardware profile...");
        const fallbackProfile = {
          id: supaUser.id,
          name: supaUser.user_metadata.full_name || supaUser.user_metadata.name || supaUser.email?.split('@')[0] || 'User',
          email: supaUser.email || '',
          role: isUserAdmin ? 'admin' : 'customer'
        };
        
        const { error: upsertError } = await supabase.from('profiles').upsert(fallbackProfile);
        if (upsertError) {
          console.error("[Auth] 🛑 Profile Initialization Failed:", upsertError.message);
        }
        
        setUser({ ...fallbackProfile } as any);
        setIsAdmin(isUserAdmin);
      }
    } catch (err: any) {
      console.error("[Auth] 💥 Fatal Sync Exception:", err.message);
      // Fail-safe protection for owner
      if (currentEmail === ownerEmail) {
        console.log("[Auth] 👑 Emergency Owner Access Granted.");
        setIsAdmin(true);
        setUser({ id: supaUser.id, email: supaUser.email, name: 'Main Owner', role: 'admin' } as any);
      }
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
    setLoading(true);
    await loginWithGoogle();
    // We don't return immediately because the popup happens async
    // AuthProvider's onAuthStateChange will handle the result.
    return true;
  };

  const loginWithPin = (pin: string) => {
    if (pin === "8585") {
      setIsAdmin(true);
      // Set a placeholder user so that Admin features aren't locked
      setUser({ id: 'legacy-admin', name: 'Authorized PIN Admin', email: 'pin-admin@solo.com', role: 'admin' } as any);
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
        isRecovering,
        clearRecoveryState: () => setIsRecovering(false),
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
