import { createClient } from '@supabase/supabase-js'

// Use environment variables for Supabase configuration
// We use ?.trim() to ensure no accidental whitespace causes issues
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
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

// Single instance of the Supabase client
export const supabase = createClient(
  cleanUrl,
  supabaseKey || '',
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
