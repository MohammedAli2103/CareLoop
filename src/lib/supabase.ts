import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[CareLoop] Supabase URL or Publishable key is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are defined in .env.local'
  );
}

// Fallback dummy values during build or if environment not loaded yet
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = supabaseKey || 'placeholder-anon-key';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    supabaseKey &&
    supabaseKey.length > 20 &&
    !supabaseUrl.includes('placeholder')
  );
};
