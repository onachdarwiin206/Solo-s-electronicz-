import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Using initializeFirestore with experimentalForceLongPolling to fix connectivity issues in sandboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Proactively enable network to ensure connection attempts start immediately
enableNetwork(db).catch(err => console.warn("Firestore enableNetwork failed:", err));

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    const start = Date.now();
    // Using getDocFromServer forces a network check
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log(`Firebase connected successfully in ${Date.now() - start}ms`);
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.error("Firebase Connection Test Result: SERVICE UNAVAILABLE OR OFFLINE", error);
      console.warn("Retrying Firestore connection in 5 seconds...");
      setTimeout(() => {
        enableNetwork(db).then(() => testConnection());
      }, 5000);
    } else {
      console.log("Firebase initialized (test doc missing or permission restricted, which is expected)", error.message);
    }
  }
}

testConnection();
