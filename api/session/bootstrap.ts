import { getAdminClient } from '../_lib/supabaseAdmin.js';

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const accessToken = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !auth.user) return response.status(401).json({ error: 'Sessão inválida.' });

    const { data: workspaceId, error } = await admin.rpc('bootstrap_user_session', {
      p_user_id: auth.user.id,
      p_email: auth.user.email || '',
      p_name: String(auth.user.user_metadata?.name || auth.user.email?.split('@')[0] || ''),
      p_company_name: String(auth.user.user_metadata?.company_name || 'Meu Workspace'),
    });
    if (error) throw error;

    return response.status(200).json({ ready: true, workspaceId });
  } catch (error) {
    console.error('POST /api/session/bootstrap failed', error);
    const message = error instanceof Error ? error.message : '';
    if (/bootstrap_user_session|relation .* does not exist|schema cache/i.test(message)) {
      return response.status(503).json({ error: 'O banco do Supabase precisa receber a migration de segurança mais recente.' });
    }
    return response.status(500).json({ error: 'Não foi possível preparar o perfil e o workspace desta conta.' });
  }
}
