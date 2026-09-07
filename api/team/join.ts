import { createHash } from 'node:crypto';
import { getAdminClient } from '../_lib/supabaseAdmin.js';

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' });
  try {
    const accessToken = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !auth.user) return response.status(401).json({ error: 'Faça login ou crie uma conta para entrar na equipe.' });
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
    if (!/^[a-f0-9]{64}$/i.test(rawToken)) return response.status(400).json({ error: 'Link de convite inválido.' });
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const { data: invitation, error } = await admin.from('workspace_invitations')
      .select('workspace_id,expires_at,max_uses,uses_count')
      .eq('token_hash', tokenHash).maybeSingle();
    if (error || !invitation) return response.status(404).json({ error: 'Convite não encontrado.' });
    if (invitation.uses_count >= invitation.max_uses) return response.status(409).json({ error: 'Este convite atingiu o limite de entradas.' });
    if (new Date(invitation.expires_at).getTime() < Date.now()) return response.status(410).json({ error: 'Este convite expirou.' });
    const displayName = String(auth.user.user_metadata?.name || auth.user.email?.split('@')[0] || 'Membro').trim();
    const { data: result, error: joinError } = await admin.rpc('accept_workspace_invitation', {
      p_token_hash: tokenHash,
      p_user_id: auth.user.id,
      p_name: displayName,
      p_email: auth.user.email || '',
    });
    if (joinError) throw joinError;
    return response.status(200).json(result);
  } catch (error) {
    console.error('POST /api/team/join failed', error);
    const message = error instanceof Error ? error.message : '';
    if (/accept_workspace_invitation|schema cache|function .* does not exist/i.test(message)) {
      return response.status(503).json({ error: 'Execute supabase/CORRECAO-WORKSPACES-E-CONVITES.sql no Supabase.' });
    }
    if (/Configure uma URL Supabase válida|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return response.status(503).json({ error: 'As variáveis privadas do Supabase não estão configuradas corretamente na Vercel.' });
    }
    const knownMessage = /Convite|equipe|plano|Workspace|Sessão/i.test(message) ? message : '';
    return response.status(500).json({ error: knownMessage || 'Não foi possível entrar na equipe.' });
  }
}
