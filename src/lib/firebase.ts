import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// CRITICAL: Using initializeFirestore with experimentalForceLongPolling
// to fix connectivity issues in sandboxed/iframe environments.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Proactively enable network to ensure connection attempts start immediately
enableNetwork(db).catch(err => console.warn("Firestore enableNetwork failed:", err));

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Ensure local persistence for better UX
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Auth persistence failed:", err));

async function testConnection() {
  try {
    const start = Date.now();
    // Using getDocFromServer forces a network check and bypasses cache
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log(`%cFirebase connected successfully in ${Date.now() - start}ms`, "color: green; font-weight: bold;");
  } catch (error: any) {
    const isOffline = error.code === 'unavailable' || error.message?.includes('offline');
    const isPermission = error.code === 'permission-denied';

    if (isOffline) {
      console.error("%cFirebase Connection Result: OFFLINE / UNAVAILABLE", "color: red; font-weight: bold;");
      console.warn("ACTION REQUIRED FOR DEVELOPER: \n" +
        "1. Open Firebase Console: https://console.firebase.google.com/project/soloz-aa9a1/firestore \n" +
        "2. Ensure a Database is created in 'Production Mode' (or Test Mode). \n" +
        "3. Add these domains to Auth/Settings/Authorized Domains: \n" +
        `   - ${window.location.hostname} \n` +
        "   - ais-dev-u4d3jlgb5swspoztdkme7a-420958073420.europe-west1.run.app \n" +
        "   - ais-pre-u4d3jlgb5swspoztdkme7a-420958073420.europe-west1.run.app \n" +
        "4. If error persists, check if the Firestore API is enabled in Google Cloud Console.");
      
      setTimeout(() => {
        enableNetwork(db).then(() => testConnection());
      }, 10000); // Increased retry to 10s to reduce noise
    } else if (isPermission) {
      console.log("%cFirebase connected (Access restricted as expected)", "color: orange;");
    } else {
      console.log("Firebase initialized (Status:", error.code, ")", error.message);
    }
  }
}

testConnection();
