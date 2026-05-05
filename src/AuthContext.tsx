import { createContext, useEffect, useState, useContext, ReactNode } from "react";
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { UserProfile } from './types';

type AuthType = {
  user: UserProfile | null;
  fbUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
  user: null,
  fbUser: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  logout: async () => {}
});

const ADMIN_EMAIL = 'onachdarwiin@gmail.com';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: User) => {
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
      console.error("AuthProvider Profile Fetch Error:", error);
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
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        fbUser,
        loading,
        isAdmin,
        signInWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
