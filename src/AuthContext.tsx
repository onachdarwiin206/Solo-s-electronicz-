import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { db } from "./firebase";
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from './types';

type AuthType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginAsAdmin: (pin: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthType>({
  user: null,
  loading: true,
  isAdmin: false,
  loginAsAdmin: async () => false,
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

  const loginAsAdmin = async (pin: string) => {
    try {
      const adminDoc = await getDoc(doc(db, 'system', 'admin'));
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
      console.error("Admin verification error:", error);
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
