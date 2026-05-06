import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, getDocFromServer } from 'firebase/firestore';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './lib/error-handler';

type AuthType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginAsAdmin: (pin: string) => Promise<boolean>;
  loginWithGoogleAdmin: () => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthType>({
  user: null,
  loading: true,
  isAdmin: false,
  loginAsAdmin: async () => false,
  loginWithGoogleAdmin: async () => false,
  logout: () => {}
});

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ADMIN_PIN = "8585";

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
      const { loginWithGoogle } = await import('./auth');
      const user = await loginWithGoogle();
      
      if (!user || !user.email) return false;

      const adminDoc = await getDocFromServer(doc(db, adminPath));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        let allowedEmails = data.allowedEmails || [];
        
        // Bootstrap: If list is empty, the first person to try is whitelisted
        if (allowedEmails.length === 0) {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, adminPath), { allowedEmails: [user.email] });
          allowedEmails = [user.email];
        }

        if (allowedEmails.includes(user.email)) {
          setIsAdmin(true);
          sessionStorage.setItem('admin_auth', 'true');
          sessionStorage.setItem('admin_last_active', Date.now().toString());
          return true;
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, adminPath);
    }
    return false;
  };

  const loginAsAdmin = async (pin: string) => {
    const adminPath = 'system/admin';
    try {
      const adminDoc = await getDocFromServer(doc(db, adminPath));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        if (data.pin === pin) {
          setIsAdmin(true);
          sessionStorage.setItem('admin_auth', 'true');
          sessionStorage.setItem('admin_last_active', Date.now().toString());
          return true;
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, adminPath);
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
        loginAsAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
