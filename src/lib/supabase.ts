import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[CareLoop] Supabase URL or Publishable key is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are defined in .env.local'
  );
}

// Fallback dummy values during build or if environment not loaded yet
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl.replace(/\/+$/, '') : 'https://placeholder.supabase.co';
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

export const getSupabaseHost = (): string => {
  try {
    const parsed = new URL(validUrl);
    return parsed.host;
  } catch {
    return 'supabase.co';
  }
};

/**
 * Check if the remote Supabase project endpoint is reachable.
 * Distinguishes online projects from paused/unreachable projects without exposing credentials.
 */
export const checkSupabaseHealth = async (timeoutMs = 3500): Promise<{ reachable: boolean; status?: number; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { reachable: false, error: 'Supabase URL or Publishable key is not configured.' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${validUrl}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: validKey },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { reachable: true, status: res.status };
    }
    return { reachable: false, status: res.status, error: `Supabase returned HTTP status ${res.status}` };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const host = getSupabaseHost();
    if (err.name === 'AbortError') {
      return { reachable: false, error: `Connection to ${host} timed out after ${timeoutMs}ms.` };
    }
    return {
      reachable: false,
      error: `Could not reach ${host}. The Supabase project may be paused in your dashboard or DNS is unavailable.`,
    };
  }
};

/**
 * Formats backend errors into user-friendly diagnostic messages
 * preventing cryptic "Failed to fetch" browser exceptions.
 */
export const formatAuthErrorMessage = (err: unknown): { title: string; message: string; isNetworkError: boolean } => {
  const host = getSupabaseHost();
  const rawMsg = err instanceof Error ? err.message : String(err);

  // Network / DNS / Paused project / Failed to fetch
  if (
    rawMsg.toLowerCase().includes('failed to fetch') ||
    rawMsg.toLowerCase().includes('network') ||
    rawMsg.toLowerCase().includes('enotfound') ||
    rawMsg.toLowerCase().includes('load failed') ||
    (err instanceof TypeError && rawMsg.toLowerCase().includes('fetch'))
  ) {
    return {
      title: 'Backend Connection Unreachable',
      message: `Could not reach Supabase endpoint (${host}). If this is a free-tier Supabase project, it may be paused due to inactivity. Check your Supabase Dashboard to unpause it, or check your internet/DNS connection.`,
      isNetworkError: true,
    };
  }

  // SMS Provider not configured in Supabase Auth
  if (
    rawMsg.toLowerCase().includes('provider') ||
    rawMsg.toLowerCase().includes('sms') ||
    rawMsg.toLowerCase().includes('not configured') ||
    rawMsg.toLowerCase().includes('unsupported')
  ) {
    return {
      title: 'SMS Provider Configuration Required',
      message: 'Supabase Phone Authentication requires a configured SMS provider (e.g. Twilio or MessageBird) in your Supabase Dashboard.',
      isNetworkError: false,
    };
  }

  return {
    title: 'Registration Request Failed',
    message: rawMsg || 'An unexpected error occurred during account submission. Please try again.',
    isNetworkError: false,
  };
};
