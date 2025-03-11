/**
 * useSupabase Hook
 * 
 * A hook that provides access to the Supabase client.
 * Creates a single, application-wide instance of the Supabase client
 * using the singleton pattern to ensure efficient connection management.
 * 
 * 
 * @returns The Supabase client instance
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a truly singleton client at the module level
// This ensures only one client exists across the entire application
let supabaseClient: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  console.info('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  // Create a fake client that throws errors when methods are called
  supabaseClient = new Proxy({} as SupabaseClient, {
    get: (_, prop) => () => {
      throw new Error(`Supabase client failed to initialize. Cannot call method "${String(prop)}".`);
    }
  });
}

export function useSupabase(): SupabaseClient {
  return supabaseClient;
} 