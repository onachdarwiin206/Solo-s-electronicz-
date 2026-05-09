import { createClient } from "@supabase/supabase-js";

// --- REPLACE THESE WITH YOUR OWN SUPABASE CREDENTIALS ---
// 1. Your Project URL (Home -> Settings -> API -> Project URL)
const SUPABASE_URL = "https://rzbgipdajulkunlswygz.supabase.co"; 

// 2. Your Anon/Public Key (Home -> Settings -> API -> anon public)
const SUPABASE_PUBLIC_KEY = "sb_publishable_nI4YRsOoKELjPKkUkJ_P_w_EM19pUhO";
// --------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
