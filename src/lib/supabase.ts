import { createClient } from '@supabase/supabase-js'

// Use environment variables for Supabase configuration
// We use ?.trim() to ensure no accidental whitespace causes issues
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "https://rzbgipdajulkunlswygz.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// Validation: Ensure environment variables are actually present
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.length > 20 && 
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  const msg = import.meta.env.PROD 
    ? "[Supabase] Configuration missing! Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel settings."
    : "[Supabase] Configuration missing! Check your .env file.";
  console.warn(msg);
}

// Clean URL: ensure it starts with https:// and remove any accidentally appended paths
const getCleanUrl = (url: string | undefined): string => {
  if (!url || url.trim() === "" || url.includes('placeholder')) return "https://placeholder.supabase.co";
  
  try {
    let val = url.trim();
    if (!val.startsWith('http')) val = `https://${val}`;
    const u = new URL(val);
    return `${u.protocol}//${u.host}`;
  } catch (e) {
    return url.split('/rest/v1')[0].replace(/\/+$/, "");
  }
};

const cleanUrl = getCleanUrl(supabaseUrl);

// Use a placeholder JWT to prevent initialization crashes in unconfigured sandboxed or static builds
const dummyAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzkyOTMyMDAsImV4cCI6MjAwMTM2OTIwMH0.placeholder';

// Single instance of the Supabase client
export const supabase = createClient(
  cleanUrl,
  supabaseKey || dummyAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: { 'x-application-name': 'solo-electronics' }
    },
    db: {
      schema: 'public'
    }
  }
)

// Optional: Health check to log configuration state (obscured for safety)
if (import.meta.env.DEV) {
  console.log('[Supabase] Initialized with URL:', cleanUrl ? `${cleanUrl.substring(0, 12)}...` : 'MISSING');
}

export interface ResolvedProfile {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  wishlist: string[];
  likes: string[];
  avatar_url?: string;
  orders_count?: number;
  created_at?: string;
}

/**
 * Centrally resolves a User's profile structure from either remote Supabase,
 * database fallback queries, or the sandbox offline database.
 */
export async function resolveUserProfile(userId: string, authUserMetadata?: any): Promise<ResolvedProfile> {
  const defaultProfile: ResolvedProfile = {
    id: userId,
    email: authUserMetadata?.email || '',
    name: authUserMetadata?.full_name || authUserMetadata?.name || 'User',
    role: 'customer',
    wishlist: [],
    likes: []
  };

  if (!isSupabaseConfigured) {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('solo_sandbox_session');
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached && (cached.id === userId || cached.email === authUserMetadata?.email)) {
            return {
              ...defaultProfile,
              ...cached,
              role: cached.role || 'customer',
              wishlist: Array.isArray(cached.wishlist) ? cached.wishlist : [],
              likes: Array.isArray(cached.likes) ? cached.likes : []
            };
          }
        }
      } catch (e) {
        console.warn("[Sandbox] Profile local resolution warning:", e);
      }
    }
    return defaultProfile;
  }

  try {
    // 1. High fidelity query: Select everything first
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!pErr && profile) {
      return {
        ...defaultProfile,
        ...profile,
        wishlist: Array.isArray(profile.wishlist) ? profile.wishlist : [],
        likes: Array.isArray(profile.likes) ? profile.likes : []
      };
    }

    // 2. Medium fidelity query: Fallback if 'likes' column is missing or errors out
    if (pErr && pErr.message?.includes('likes')) {
      const { data: fallback, error: fErr } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar_url, orders_count, created_at, wishlist')
        .eq('id', userId)
        .single();

      if (!fErr && fallback) {
        return {
          ...defaultProfile,
          ...fallback,
          wishlist: Array.isArray(fallback.wishlist) ? fallback.wishlist : [],
          likes: []
        };
      }
    }
  } catch (err) {
    console.warn("[Profile Resolver] Central lookup failure, using defaults:", err);
  }

  return defaultProfile;
}
