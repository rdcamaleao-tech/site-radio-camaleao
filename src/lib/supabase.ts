import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user (with fallbacks if env vars are set)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iqezxgrdrmrhnrrukjyd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_28_vaCHnHmbLMIGDob-R2w_bUZ5aIgp';

// Standardize URL by removing trailing /rest/v1 if passed by mistake
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey);
};
