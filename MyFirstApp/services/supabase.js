// ============================================================
// Supabase Client for the React Native Frontend
// This file creates a connection to your Supabase database
// so that the app can communicate with it directly.
// ============================================================

import { createClient } from '@supabase/supabase-js';

// Your Supabase project URL (found in: Supabase > Settings > API)
const SUPABASE_URL = 'https://lphgjwhmyzutppgtzmbw.supabase.co';

// Your Supabase Anon/Public Key (safe to use in frontend code)
const SUPABASE_ANON_KEY = 'sb_publishable_yZTvaK-QmvtBFBlVvISCdQ_peFl63Ey';

// Create and export the Supabase client instance
// This 'supabase' object is used throughout the app to read/write data
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
