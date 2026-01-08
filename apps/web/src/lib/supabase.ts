import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are available
const hasCredentials = supabaseUrl && supabaseAnonKey;

if (!hasCredentials) {
  console.warn(
    "Supabase credentials not found. Online features will be disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

// Only create client if we have valid credentials
// Use a placeholder URL for offline mode to prevent initialization errors
export const supabase: SupabaseClient<Database> | null = hasCredentials
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = hasCredentials;
