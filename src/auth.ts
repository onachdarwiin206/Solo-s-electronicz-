import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Authenticated User:", result.user);
    return result.user;
  } catch (error: any) {
    console.error("Google Login Error:", error.code, error.message);
    if (error.code === 'auth/unauthorized-domain') {
       console.error("CRITICAL: This domain is not authorized in Firebase Console.");
       console.error("ADD TO AUTH -> SETTINGS -> DOMAINS:");
       console.error("- localhost");
       console.error(`- ${window.location.hostname}`);
       console.error("- ais-dev-u4d3jlgb5swspoztdkme7a-420958073420.europe-west1.run.app");
       console.error("- ais-pre-u4d3jlgb5swspoztdkme7a-420958073420.europe-west1.run.app");
       console.error("- solo-s-electronicz.vercel.app");
    }
    throw error;
  }
};
