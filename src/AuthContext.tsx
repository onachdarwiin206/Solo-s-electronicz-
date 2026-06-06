import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { UserProfile } from './types';
import { signUp as supaSignUp, login as supaLogin, logoutUser, sendResetPasswordEmail, AuthResponse, loginWithGoogle as supaLoginWithGoogle } from './auth';
import { safeGetLocalStorage, safeSetLocalStorage, SANDBOX_SYNC_EVENT } from "./lib/sandboxDb";

type AuthType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isRecovering: boolean;
  clearRecoveryState: () => void;
  signUp: (email: string, password: string, fullName: string, whatsapp: string) => Promise<AuthResponse>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  toggleLike: (productId: string) => Promise<boolean>;
  loginWithPin: (pin: string, email?: string) => boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
  user: null,
  loading: true,
  isAdmin: false,
  isRecovering: false,
  clearRecoveryState: () => {},
  signUp: async () => ({ success: false, error: 'Not implemented' }),
  login: async () => ({ success: false, error: 'Not implemented' }),
  loginWithGoogle: async () => ({ success: false, error: 'Not implemented' }),
  resetPassword: async () => ({ success: false, error: 'Not implemented' }),
  toggleWishlist: async () => false,
  toggleLike: async () => false,
  loginWithPin: () => false,
  logout: async () => {}
});

export const ADMIN_EMAILS = ['onachdarwiin@gmail.com', 'wanchaaaron@gmail.com'];
export const ADMIN_PIN = "8585";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize state across tabs & local triggers
  useEffect(() => {
    const handleSync = (e: any) => {
      const { key, value } = e.detail;
      if (key === 'solo_sandbox_session') {
        setUser(value);
        if (value) {
          setIsAdmin(value.role === 'admin' || ADMIN_EMAILS.includes(value.email?.toLowerCase()));
        } else {
          setIsAdmin(false);
        }
      }
    };
    window.addEventListener(SANDBOX_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SANDBOX_SYNC_EVENT, handleSync);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.opener && (window.location.hash.includes('access_token=') || window.location.search.includes('code='))) {
       window.close();
    }

    if (!isSupabaseConfigured) {
      const mockUser = safeGetLocalStorage<UserProfile | null>('solo_sandbox_session', null);
      if (mockUser) {
        setUser(mockUser);
        setIsAdmin(mockUser.role === 'admin' || ADMIN_EMAILS.includes(mockUser.email?.toLowerCase()));
      }
      setLoading(false);
      return;
    }

    let isInitialized = false;

    // First, check the current user immediately for maximum security
    const initAuth = async () => {
      try {
        // getUser() is more secure than getSession() as it verifies the token with Supabase
        const { data: { user: supaUser }, error } = await supabase.auth.getUser();
        
        if (supaUser) {
          // If user exists, fetch session to get full session object if needed
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await handleSessionChange(session);
          } else {
            // Fallback if session is missing but user exists (edge case)
            setLoading(false);
          }
        } else {
          setLoading(false);
          setIsAdmin(false);
          setUser(null);
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
    
    try {
      // Fetch profile - created by DB trigger for robustness
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .single();

      const isDefaultAdmin = ADMIN_EMAILS.includes(supaUser.email?.toLowerCase() || '');

      if (profileError) {
        console.warn("[Auth] Profile fetch failed:", profileError.message);
        setUser({ 
          id: supaUser.id, 
          email: supaUser.email || '', 
          name: supaUser.user_metadata?.full_name || 'User',
          role: isDefaultAdmin ? 'admin' : 'customer'
        } as any);
        setIsAdmin(isDefaultAdmin);
      } else {
        const finalRole = isDefaultAdmin ? 'admin' : profile.role;
        setUser({ id: supaUser.id, ...profile, role: finalRole } as any);
        setIsAdmin(finalRole === 'admin');
      }
    } catch (err: any) {
      console.error("[Auth] Sync Exception:", err.message);
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

  const loginWithPin = (pin: string, email?: string) => {
    if (pin === ADMIN_PIN) {
      const normalizedEmail = email?.toLowerCase();
      
      // If an email is provided, it MUST be one of the admin emails
      if (normalizedEmail && !ADMIN_EMAILS.includes(normalizedEmail)) {
        return false;
      }

      setIsAdmin(true);
      
      // Use existing user if they are one of the admins, otherwise set placeholder
      if (user && (ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.id === 'legacy-admin')) {
        setUser({ ...user, role: 'admin' });
      } else {
        const targetEmail = normalizedEmail || ADMIN_EMAILS[0];
        setUser({ 
          id: 'legacy-admin', 
          name: 'Authorized Admin', 
          email: targetEmail, 
          role: 'admin' 
        } as any);
      }
      return true;
    }
    return false;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsAdmin(false);
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_last_active');
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return false;
    const currentWishlist = user.wishlist || [];
    const isWishlisted = currentWishlist.includes(productId);
    const newWishlist = isWishlisted 
      ? currentWishlist.filter(id => id !== productId)
      : [...currentWishlist, productId];
    
    if (!isSupabaseConfigured) {
      const updatedUser = { ...user, wishlist: newWishlist };
      setUser(updatedUser);
      safeSetLocalStorage('solo_sandbox_session', updatedUser);
      
      const users = safeGetLocalStorage<any[]>('solo_sandbox_users', []);
      const updatedUsers = users.map((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase() ? { ...u, wishlist: newWishlist } : u);
      safeSetLocalStorage('solo_sandbox_users', updatedUsers);
      return true;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wishlist: newWishlist })
        .eq('id', user.id);
      if (!error) {
        setUser({ ...user, wishlist: newWishlist });
        return true;
      }
    } catch (e) {
      console.error("Wishlist toggle error:", e);
    }
    return false;
  };

  const toggleLike = async (productId: string) => {
    if (!user) return false;
    const currentLikes = user.likes || [];
    const isLiked = currentLikes.includes(productId);
    const newLikes = isLiked 
      ? currentLikes.filter(id => id !== productId)
      : [...currentLikes, productId];
    
    if (!isSupabaseConfigured) {
      const updatedUser = { ...user, likes: newLikes };
      setUser(updatedUser);
      safeSetLocalStorage('solo_sandbox_session', updatedUser);
      
      const users = safeGetLocalStorage<any[]>('solo_sandbox_users', []);
      const updatedUsers = users.map((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase() ? { ...u, likes: newLikes } : u);
      safeSetLocalStorage('solo_sandbox_users', updatedUsers);
      return true;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ likes: newLikes })
        .eq('id', user.id);
      if (!error) {
        setUser({ ...user, likes: newLikes });
        // Also update likes count in products table
        await supabase.rpc('toggle_product_like', { 
          p_id: productId, 
          increment: !isLiked 
        });
        return true;
      }
    } catch (e) {
      console.error("Likes toggle error:", e);
    }
    return false;
  };

  const contextSignUp = async (email: string, password: string, fullName: string, whatsapp: string) => {
    const res = await supaSignUp(email, password, fullName, whatsapp);
    if (!isSupabaseConfigured && res.success && res.user) {
      setUser(res.user);
      setIsAdmin(res.user.role === 'admin');
      safeSetLocalStorage('solo_sandbox_session', res.user);
    }
    return res;
  };

  const contextLogin = async (email: string, password: string) => {
    const res = await supaLogin(email, password);
    if (!isSupabaseConfigured && res.success && res.user) {
      setUser(res.user);
      setIsAdmin(res.user.role === 'admin');
      safeSetLocalStorage('solo_sandbox_session', res.user);
    }
    return res;
  };

  const contextLoginWithGoogle = async () => {
    const res = await supaLoginWithGoogle();
    if (!isSupabaseConfigured && res.success && res.user) {
      setUser(res.user);
      setIsAdmin(res.user.role === 'admin');
      safeSetLocalStorage('solo_sandbox_session', res.user);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isRecovering,
        clearRecoveryState: () => setIsRecovering(false),
        signUp: contextSignUp,
        login: contextLogin,
        loginWithGoogle: contextLoginWithGoogle,
        resetPassword: sendResetPasswordEmail,
        toggleWishlist,
        toggleLike,
        loginWithPin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
