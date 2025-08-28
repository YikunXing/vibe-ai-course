
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseKey ? 'Set' : 'Missing'
  });
}

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    const error = new Error('Missing Supabase environment variables. Please check your .env.local file.');
    console.error('Supabase client creation failed:', error.message);
    throw error;
  }
  
  try {
    return createBrowserClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error(`Failed to create Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
