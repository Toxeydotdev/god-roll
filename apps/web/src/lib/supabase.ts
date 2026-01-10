import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

// Validate credentials - must be non-empty strings with valid format
function validateCredentials(): boolean {
  // Check for non-empty strings
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  // Trim and check again (catches whitespace-only values)
  const url = supabaseUrl.trim();
  const key = supabaseAnonKey.trim();

  if (!url || !key) {
    return false;
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    console.warn("Invalid Supabase URL format:", url);
    return false;
  }

  // Anon key should be a JWT (starts with eyJ) or at least be reasonably long
  if (key.length < 20) {
    console.warn("Supabase anon key appears to be invalid (too short)");
    return false;
  }

  return true;
}

const hasCredentials = validateCredentials();

if (!hasCredentials) {
  console.warn(
    "Supabase credentials not found or invalid. Online features will be disabled."
  );
}

// Safely create the Supabase client with error handling
function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!hasCredentials) {
    return null;
  }

  try {
    return createClient<Database>(supabaseUrl.trim(), supabaseAnonKey.trim());
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}

export const supabase = createSupabaseClient();
export const isSupabaseConfigured = hasCredentials && supabase !== null;
