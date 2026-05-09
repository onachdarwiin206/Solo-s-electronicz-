import { supabase } from "./supabaseClient";

export const signupWithEmail = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    console.error("Signup error:", error.message);
    return { user: null, session: null, error: error.message };
  }
  
  // If user signed up but email needs verification, session might be null
  return { user: data.user, session: data.session, error: null };
};

export const loginWithEmail = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    console.error("Login error:", error.message);
    return { user: null, error: "Email or password is incorrect." };
  }
  return { user: data.user, error: null };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
    return false;
  }
  return true;
};

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  });

  if (error) {
    console.error("Login error:", error.message);
    return null;
  }
  // Note: OAuth usually redirects, so this won't return a user immediately in the same way popup did
  return null; 
};
