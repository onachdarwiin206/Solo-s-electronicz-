import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { supabase } from "./supabaseClient";
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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleSessionChange(session);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Session check error:", e);
        setLoading(false);
      }
    };

    checkSession();

    // Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleSessionChange(session);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleSessionChange = async (session: any) => {
    if (!session) return;
    setLoading(true);
    const { user: supaUser } = session;
    
    try {
      // Fetch profile from 'profiles' table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .single();

      if (profile) {
        setUser({ id: supaUser.id, ...profile } as any);
        // Sync Admin state if the role is admin in database
        if (profile.role === 'admin') setIsAdmin(true);
      } else {
        // If profile doesn't exist, create it
        const newProfile = {
          id: supaUser.id,
          name: supaUser.user_metadata.full_name || supaUser.email?.split('@')[0] || 'User',
          email: supaUser.email || '',
          role: 'customer',
          created_at: new Date().toISOString()
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();
          
        if (!createError) {
          setUser(createdProfile as any);
        }
      }
    } catch (err) {
      console.error("Profile sync error:", err);
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
    const adminSession = sessionStorage.getItem('admin_auth');
    const lastActive = sessionStorage.getItem('admin_last_active');
    
    if (adminSession === 'true' && lastActive) {
      const now = Date.now();
      if (now - parseInt(lastActive) < INACTIVITY_TIMEOUT) {
        setIsAdmin(true);
      }
    }

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
  }, []);

  useEffect(() => {
    if (isAdmin) {
      resetInactivityTimer();
      sessionStorage.setItem('admin_last_active', Date.now().toString());
    }
  }, [isAdmin]);

  const loginWithGoogleAdmin = async () => {
    // This would typically involve checking a specific column in a profiles table or a separate admin table
    await loginWithGoogle();
    return false; // Redirect handles result
  };

  const loginWithPin = (pin: string) => {
    if (pin === "8585") {
      setIsAdmin(true);
      sessionStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_last_active', Date.now().toString());
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
