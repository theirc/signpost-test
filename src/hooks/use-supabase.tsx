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

// NOTE: Move these to environment variables when we have a production environment
const supabaseUrl = 'https://jtystutuijtkbemrnayl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXN0dXR1aWp0a2JlbXJuYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyODQ2ODAsImV4cCI6MjA1NDg2MDY4MH0.SRxEN0K4YTe-fjeTK_p8G2v6aT7ON0nv7sCaneoWjNc'

// Create a truly singleton client at the module level
// This ensures only one client exists across the entire application
let supabaseClient: SupabaseClient;

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