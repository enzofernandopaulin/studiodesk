import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type PublicConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
};

export let supabase: SupabaseClient | null = null;
export let isSupabaseConfigured = false;

function configureSupabase(urlValue?: string, keyValue?: string): boolean {
  const url = urlValue?.trim();
  const key = keyValue?.trim();
  if (!url?.startsWith('https://') || !key || key.startsWith('sb_secret_')) return false;

  supabase = createClient(url, key, clientOptions);
  isSupabaseConfigured = true;
  return true;
}

configureSupabase(
  import.meta.env.VITE_SUPABASE_URL as string | undefined,
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
    || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined),
);

/**
 * Vite incorpora VITE_* durante o build. Em deploys onde essa incorporação não
 * ocorreu, usa a função da Vercel como fallback. O endpoint retorna somente a
 * URL e a chave pública; a service_role nunca é enviada ao navegador.
 */
export async function initializeSupabase(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) return true;

  try {
    const response = await fetch('/api/public-config', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const config = await response.json() as PublicConfig;
    return configureSupabase(config.supabaseUrl, config.supabasePublishableKey);
  } catch (error) {
    console.error('StudioDesk: configuração pública do Supabase indisponível', error);
    return false;
  }
}
