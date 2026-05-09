import { createClient } from "@supabase/supabase-js";

// Helper to validate Supabase URL
const isValidUrl = (url) => {
  try {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch {
    return false;
  }
};

// --- CREDENTIALS CONFIGURATION ---
// We prefer environment variables from the Settings menu first.
// If missing, we fallback to the hardcoded placeholders you provided.
const ENV_URL = import.meta.env.VITE_SUPABASE_URL;
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PLACEHOLDER_URL = "https://rzbgipdajulkunlswygz.supabase.co"; 
const PLACEHOLDER_KEY = "sb_publishable_nI4YRsOoKELjPKkUkJ_P_w_EM19pUhO";

export const supabaseUrl = ENV_URL || PLACEHOLDER_URL;
export const supabaseAnonKey = ENV_KEY || PLACEHOLDER_KEY;

// Detect if settings are actually configured or if we are using invalid placeholders
export const credentialsMissing = 
  !isValidUrl(supabaseUrl) || 
  !supabaseAnonKey || 
  supabaseAnonKey === PLACEHOLDER_KEY || 
  supabaseAnonKey.startsWith('sb_publishable'); // Detection for the invalid key format provided

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = credentialsMissing ? 'placeholder-key' : supabaseAnonKey;

export const supabase = createClient(finalUrl, finalKey);

if (credentialsMissing && typeof window !== 'undefined') {
  console.warn("Supabase Configuration Required: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings.");
}
