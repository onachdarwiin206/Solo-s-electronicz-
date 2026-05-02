import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Using initializeFirestore with experimentalForceLongPolling to fix connectivity issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    const start = Date.now();
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log(`Firebase connected successfully in ${Date.now() - start}ms`);
  } catch (error: any) {
    console.error("Firebase Connection Test Failed:", error);
    if (error.code === 'unavailable' || error.message.includes('the client is offline')) {
      console.error("DEBUG: Firebase is unreachable. This may be due to browser privacy settings or network restrictions.");
    }
  }
}

testConnection();
