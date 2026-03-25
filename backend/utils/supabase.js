import 'dotenv/config'; // Fallback: ensure dotenv is loaded even if this file is imported first
import { createClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// Supabase Client Initialization
// ──────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Fail fast with a clear error if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌  ERROR: Missing Supabase credentials in .env file.");
  console.error("Please make sure your .env file contains:");
  console.error("SUPABASE_URL=your_project_url");
  console.error("SUPABASE_ANON_KEY=your_anon_key");
  
  throw new Error(
    "Missing Supabase environment variables. Check your .env file."
  );
}

console.log("✅  Supabase Client Initialized");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
