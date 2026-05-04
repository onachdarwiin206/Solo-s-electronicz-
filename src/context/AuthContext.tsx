import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  fbUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'onachdarwiin@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      const isAdminUser = firebaseUser.email === ADMIN_EMAIL;
      
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        // Verify admin role consistency
        if (isAdminUser && data.role !== 'admin') {
          await updateDoc(userRef, { role: 'admin' });
          data.role = 'admin';
        }
        setUser(data);
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Client',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          role: isAdminUser ? 'admin' : 'customer',
          createdAt: serverTimestamp(),
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
      setLoading(true);
      if (firebaseUser) {
        setFbUser(firebaseUser);
        await fetchProfile(firebaseUser);
      } else {
        setFbUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (fbUser) {
      await fetchProfile(fbUser);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, fbUser, loading, isAdmin, refreshProfile }}>
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
