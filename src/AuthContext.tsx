import { createContext, useEffect, useState, useContext, ReactNode, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, getDocFromServer } from 'firebase/firestore';
import { UserProfile } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const serialized = JSON.stringify(errInfo);
  console.error('Firestore Error: ', serialized);
  throw new Error(serialized);
}

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
