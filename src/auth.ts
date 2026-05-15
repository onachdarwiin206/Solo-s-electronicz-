import { supabase } from "./lib/supabase";

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
}

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
    return false;
  }
  return true;
};

export const signUp = async (email: string, password: string, fullName: string, whatsapp: string): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        whatsapp: whatsapp,
      }
    }
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user };
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { success: false, error: error.message };
  
  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  return { 
    success: true, 
    user: { ...data.user, role: profile?.role || 'customer' } 
  };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { ...user, ...profile };
};

export const sendResetPasswordEmail = async (email: string): Promise<AuthResponse> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?view=reset-password`,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const requireAdmin = async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '/login?error=admin_required';
    return false;
  }
  return true;
};
