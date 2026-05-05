import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Authenticated User:", result.user);
    return result.user;
  } catch (error: any) {
    console.error("Google Login Error:", error.code, error.message);
    throw error;
  }
};
