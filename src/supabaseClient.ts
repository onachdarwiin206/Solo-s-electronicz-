import { createClient } from "@supabase/supabase-js";

/**
 * --- SUPABASE CONFIGURATION ---
 * 1. Go to your Supabase Project Settings > API
 * 2. Copy the "Project URL" and paste it into VITE_SUPABASE_URL in the Settings menu
 * 3. Copy the "anon" public key and paste it into VITE_SUPABASE_ANON_KEY in the Settings menu
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rzbgipdajulkunlswygz.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_nI4YRsOoKELjPKkUkJ_P_w_EM19pUhO";

// Enhanced Detection: Check if we are still using placeholders or provided invalid format
export const credentialsMissing = 
  !SUPABASE_URL || 
  SUPABASE_URL.includes("rzbgipdajulkunlswygz") || 
  !SUPABASE_ANON_KEY || 
  SUPABASE_ANON_KEY.includes("sb_publishable") ||
  SUPABASE_ANON_KEY.length < 40; // Real Supabase keys are long JWTs

// We use hardcoded placeholders to avoid crashes during initialization
// but we prevent actual network requests if credentialsMissing is true.
export const supabase = createClient(
  SUPABASE_URL.includes("http") ? SUPABASE_URL : `https://${SUPABASE_URL}.supabase.co`,
  credentialsMissing ? "placeholder-key" : SUPABASE_ANON_KEY
);
