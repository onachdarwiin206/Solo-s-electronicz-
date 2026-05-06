import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
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
// CRITICAL: experimentalForceLongPolling is REQURIED for Firestore to work in this preview environment
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

import { doc, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network. Firestore client is offline.");
    }
  }
}
testConnection();
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
