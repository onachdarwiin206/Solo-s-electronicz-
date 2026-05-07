import { auth, googleProvider } from "./firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

export const signupWithEmail = async (email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error("Signup error:", error.code);
    let message = "Signup failed.";
    if (error.code === 'auth/email-already-in-use') {
      message = "user already exist. please sign in.";
    }
    return { user: null, error: message };
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error("Login error:", error.code);
    let message = "email or password is incorrect.";
    return { user: null, error: message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};
