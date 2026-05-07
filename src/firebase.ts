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
const firebaseConfig = {
  apiKey: "AIzaSyDC97e3vIlsIsZANbPQLcmFq1cwIrXQozg",
  authDomain: "soloz1.firebaseapp.com",
  projectId: "soloz1",
  storageBucket: "soloz1.firebasestorage.app",
  messagingSenderId: "143122607520",
  appId: "1:143122607520:web:24b0b5dbdec7f768c008c5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use Memory Cache to avoid issues with persistence in proxy/iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
}, "(default)");

// Ensure network is definitively enabled
enableNetwork(db).catch(err => console.log("Firestore Network Activation:", err.message));

export const storage = getStorage(app);
storage.maxUploadRetryTime = 60000; // 60 seconds
storage.maxOperationRetryTime = 60000; // 60 seconds
export const googleProvider = new GoogleAuthProvider();

export default app;
