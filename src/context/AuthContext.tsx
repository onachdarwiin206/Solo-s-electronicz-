import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier
} from 'firebase/auth';
import { loginWithGoogle as firebaseLoginWithGoogle } from '../auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  fbUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithPhone: (phoneNumber: string, verifier: RecaptchaVerifier) => Promise<void>;
  verifyOTP: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'onachdarwiin@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const fetchProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      const isAdminUser = firebaseUser.email === ADMIN_EMAIL;
      
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        const updates: any = { lastLogin: serverTimestamp() };
        if (isAdminUser && data.role !== 'admin') {
          updates.role = 'admin';
          data.role = 'admin';
        }
        await updateDoc(userRef, updates);
        setUser({ ...data, id: firebaseUser.uid });
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Client',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          role: isAdminUser ? 'admin' : 'customer',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        setUser(newProfile);
      }
    } catch (error) {
      console.error("AuthContext Profile Fetch Error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setFbUser(firebaseUser);
          await fetchProfile(firebaseUser);
        } else {
          setFbUser(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await firebaseLoginWithGoogle();
    } catch (error: any) {
      console.error("Google Sign In Error in Context:", error);
      throw error;
    }
  };

  const loginWithPhone = async (phoneNumber: string, verifier: RecaptchaVerifier) => {
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
    } catch (error) {
      console.error("Phone Auth Login Error:", error);
      throw error;
    }
  };

  const verifyOTP = async (code: string) => {
    try {
      if (!confirmationResult) throw new Error("No active verification session");
      await confirmationResult.confirm(code);
      setConfirmationResult(null);
    } catch (error) {
      console.error("OTP Verification Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  const refreshProfile = async () => {
    if (fbUser) {
      await fetchProfile(fbUser);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      fbUser, 
      loading, 
      isAdmin, 
      signInWithGoogle, 
      loginWithPhone,
      verifyOTP,
      logout,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
