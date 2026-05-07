import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  initializeFirestore, 
  doc, 
  getDoc,
  memoryLocalCache,
  enableNetwork
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use Memory Cache to avoid issues with persistence in proxy/iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
}, firebaseConfig.firestoreDatabaseId || "(default)");

// Ensure network is definitively enabled
enableNetwork(db).catch(err => console.log("Firestore Network Activation:", err.message));

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
