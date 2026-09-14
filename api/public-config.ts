function publicSupabaseConfig() {
  const supabaseUrl = String(
    process.env.VITE_SUPABASE_URL
      || process.env.SUPABASE_URL
      || '',
  ).trim();

  const supabasePublishableKey = String(
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      || process.env.VITE_SUPABASE_ANON_KEY
      || process.env.SUPABASE_PUBLISHABLE_KEY
      || process.env.SUPABASE_ANON_KEY
      || '',
  ).trim();

  const validUrl = supabaseUrl.startsWith('https://');
  const validKey = supabasePublishableKey.length >= 20
    && !supabasePublishableKey.startsWith('sb_secret_')
    && supabasePublishableKey !== process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    configured: validUrl && validKey,
    supabaseUrl: validUrl ? supabaseUrl : '',
    supabasePublishableKey: validKey ? supabasePublishableKey : '',
    missing: [
      !validUrl ? 'SUPABASE_URL' : '',
      !validKey ? 'SUPABASE_PUBLISHABLE_KEY' : '',
    ].filter(Boolean),
  };
}

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const config = publicSupabaseConfig();
  if (!config.configured) {
    return response.status(503).json({
      configured: false,
      missing: config.missing,
      error: 'Configuração pública do Supabase indisponível neste deploy.',
    });
  }

  return response.status(200).json({
    configured: true,
    supabaseUrl: config.supabaseUrl,
    supabasePublishableKey: config.supabasePublishableKey,
  });
}
