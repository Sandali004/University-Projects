import { createClient } from '@supabase/supabase-js';

// Your Supabase project URL (found in: Supabase > Settings > API)
const SUPABASE_URL = 'https://lphgjwhmyzutppgtzmbw.supabase.co';

// Your Supabase Anon/Public Key (safe to use in frontend code)
const SUPABASE_ANON_KEY = 'sb_publishable_yZTvaK-QmvtBFBlVvISCdQ_peFl63Ey';

// Create and export the Supabase client instance
// This 'supabase' object is used throughout the app to read/write data
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
