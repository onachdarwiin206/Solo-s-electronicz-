import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC7n3797gIQcm3PtJHEIcK47HTuBChIWx4",
  authDomain: "soloz-aa9a1.firebaseapp.com",
  projectId: "soloz-aa9a1",
  storageBucket: "soloz-aa9a1.firebasestorage.app",
  messagingSenderId: "742579649366",
  appId: "1:742579649366:web:d2937286ec4c70398cb4f7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Optimized for AI Studio Preview
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
} as any);

// Enable persistence for better offline/local experience
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence.");
    }
  });
} catch (e) {
  console.error("Persistence initialization failed", e);
}

async function testConnection() {
  try {
    console.log("Checking cloud sync status...");
    // Attempting a server-forced fetch to verify connectivity
    await getDocFromServer(doc(db, 'system', 'admin'));
    console.log("Cloud Infrastructure: ONLINE");
  } catch (error) {
    console.warn("Cloud Infrastructure: OFFLINE. Switching to local-first mode with background sync.");
    console.error("Connection Error:", error);
  }
}
testConnection();

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
