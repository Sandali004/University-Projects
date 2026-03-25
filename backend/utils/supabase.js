import { createClient } from '@supabase/supabase-js';

// Support both explicit app boot and module-level lookup.
// If index.js is missing dotenv config for any reason, this makes the failure fast.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
