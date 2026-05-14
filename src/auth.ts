import { supabase } from "./lib/supabase";

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
  sessionStorage.setItem('auth_redirect_pending', 'true');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    console.error("Login error:", error.message);
    return null;
  }

  if (data?.url) {
    // Open the OAuth provider's URL directly in a popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      data.url,
      'google_auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  }
  
  return null; 
};
