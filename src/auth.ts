import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};
