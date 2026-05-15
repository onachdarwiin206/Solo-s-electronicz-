import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { UserProfile } from './types';
import { signUp as supaSignUp, login as supaLogin, logoutUser, sendResetPasswordEmail, AuthResponse } from './auth';

type AuthType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isRecovering: boolean;
  clearRecoveryState: () => void;
  signUp: (email: string, password: string, fullName: string, whatsapp: string) => Promise<AuthResponse>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  toggleLike: (productId: string) => Promise<boolean>;
  loginWithPin: (pin: string) => boolean;
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
  resetPassword: async () => ({ success: false, error: 'Not implemented' }),
  toggleWishlist: async () => false,
  toggleLike: async () => false,
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
    
    try {
      // Fetch profile - created by DB trigger for robustness
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .single();

      if (profileError) {
        console.warn("[Auth] Profile fetch failed:", profileError.message);
        setUser({ 
          id: supaUser.id, 
          email: supaUser.email || '', 
          name: supaUser.user_metadata?.full_name || 'User',
          role: 'customer'
        } as any);
        setIsAdmin(false);
      } else {
        setUser({ id: supaUser.id, ...profile } as any);
        setIsAdmin(profile.role === 'admin');
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

  const toggleWishlist = async (productId: string) => {
    if (!user) return false;
    const currentWishlist = user.wishlist || [];
    const isWishlisted = currentWishlist.includes(productId);
    const newWishlist = isWishlisted 
      ? currentWishlist.filter(id => id !== productId)
      : [...currentWishlist, productId];
    
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isRecovering,
        clearRecoveryState: () => setIsRecovering(false),
        signUp: supaSignUp,
        login: supaLogin,
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
