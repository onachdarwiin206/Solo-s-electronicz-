import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { loginWithGoogle } from './auth';

type AuthType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogleAdmin: () => Promise<boolean>;
  loginWithPin: (pin: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthType>({
  user: null,
  loading: true,
  isAdmin: false,
  loginWithGoogleAdmin: async () => false,
  loginWithPin: () => false,
  logout: () => {}
});

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isAdmin) {
      timeoutRef.current = setTimeout(() => {
        console.log("Admin session expired due to inactivity.");
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    // Check session storage for existing admin session
    const adminSession = sessionStorage.getItem('admin_auth');
    const lastActive = sessionStorage.getItem('admin_last_active');
    
    if (adminSession === 'true' && lastActive) {
      const now = Date.now();
      if (now - parseInt(lastActive) < INACTIVITY_TIMEOUT) {
        setIsAdmin(true);
      } else {
        sessionStorage.removeItem('admin_auth');
        sessionStorage.removeItem('admin_last_active');
      }
    }
    setLoading(false);

    // Activity listeners
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
    const adminPath = 'system/admin';
    try {
      const user = await loginWithGoogle();
      if (!user || !user.email) return false;

      // Use getDoc with a faster retry and silent fallback for "offline"
      let adminDoc;
      try {
        adminDoc = await getDoc(doc(db, adminPath));
      } catch (firstError: any) {
        if (firstError.message?.includes('offline')) {
          // Retry once quickly
          await new Promise(resolve => setTimeout(resolve, 300));
          adminDoc = await getDoc(doc(db, adminPath));
        } else {
          throw firstError;
        }
      }
      
      if (adminDoc && adminDoc.exists()) {
        const data = adminDoc.data();
        let allowedEmails = data.allowedEmails || [];
        
        // Bootstrap: If list is empty, the first person to try is whitelisted
        if (allowedEmails.length === 0) {
          try {
            await updateDoc(doc(db, adminPath), { allowedEmails: [user.email] });
            allowedEmails = [user.email];
          } catch (e) { console.error("Initial Whitelist Error:", e); }
        }

        if (allowedEmails.includes(user.email)) {
          setIsAdmin(true);
          sessionStorage.setItem('admin_auth', 'true');
          sessionStorage.setItem('admin_last_active', Date.now().toString());
          return true;
        }
      }
    } catch (error) {
      // If it's still offline, we can't verify, but we don't want a hard crash
      if (String(error).includes('offline')) {
         console.warn("[Auth] Verification failed due to offline state. Check network.");
      } else {
         handleFirestoreError(error, OperationType.GET, adminPath);
      }
    }
    return false;
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

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_last_active');
  };

  return (
    <AuthContext.Provider
      value={{
        user: null,
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
