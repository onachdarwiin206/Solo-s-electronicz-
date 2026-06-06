import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { safeGetLocalStorage, safeSetLocalStorage } from "./lib/sandboxDb";

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
}

// Sandbox database helper for sandbox mode
const getSandboxUsers = (): any[] => {
  return safeGetLocalStorage<any[]>('solo_sandbox_users', []);
};

const saveSandboxUser = (user: any) => {
  const users = getSandboxUsers();
  users.push(user);
  safeSetLocalStorage('solo_sandbox_users', users);
};

export const logoutUser = async () => {
  if (!isSupabaseConfigured) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('solo_sandbox_session');
    }
    return true;
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
    return false;
  }
  return true;
};

export const signUp = async (email: string, password: string, fullName: string, whatsapp: string): Promise<AuthResponse> => {
  if (!isSupabaseConfigured) {
    const existing = getSandboxUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, error: "This email address is already locked inside our sandbox registry." };
    }
    const newId = `sand-usr-${Math.random().toString(36).substr(2, 9)}`;
    const mockUser = {
      id: newId,
      email: email.toLowerCase(),
      name: fullName,
      whatsapp,
      role: ['onachdarwiin@gmail.com', 'wanchaaaron@gmail.com'].includes(email.toLowerCase()) ? 'admin' : 'customer',
      wishlist: [],
      likes: [],
      created_at: new Date().toISOString()
    };
    saveSandboxUser(mockUser);
    return { success: true, user: mockUser };
  }

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
  if (!isSupabaseConfigured) {
    const matched = getSandboxUsers().find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!matched) {
      // Create auto-guest profile for quick local tests
      const isDefaultAdmin = ['onachdarwiin@gmail.com', 'wanchaaaron@gmail.com'].includes(email.toLowerCase());
      const mockUser = {
        id: `sand-usr-${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase(),
        name: isDefaultAdmin ? 'Admin Representative' : 'Sandbox Guest User',
        whatsapp: '+256701000000',
        role: isDefaultAdmin ? 'admin' : 'customer',
        wishlist: [],
        likes: [],
        created_at: new Date().toISOString()
      };
      saveSandboxUser(mockUser);
      safeSetLocalStorage('solo_sandbox_session', mockUser);
      return { success: true, user: mockUser };
    }
    safeSetLocalStorage('solo_sandbox_session', matched);
    return { success: true, user: matched };
  }

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
  if (!isSupabaseConfigured) {
    return safeGetLocalStorage<any>('solo_sandbox_session', null);
  }

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
  if (!isSupabaseConfigured) {
    return { success: true }; // instant mock bypass
  }
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

export const loginWithGoogle = async (): Promise<AuthResponse> => {
  if (!isSupabaseConfigured) {
    const mockUser = {
      id: `sand-goo-${Math.random().toString(36).substr(2, 9)}`,
      email: 'onachdarwiin@gmail.com', // Simulate user email if matching
      name: 'Google Sync Guest',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'admin', // Auto grant admin for convenience in testing the sandboxed Google login button!
      wishlist: [],
      likes: [],
      created_at: new Date().toISOString()
    };
    safeSetLocalStorage('solo_sandbox_session', mockUser);
    return { success: true, user: mockUser };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`,
    }
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
};

