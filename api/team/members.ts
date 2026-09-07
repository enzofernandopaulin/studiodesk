import { authenticateRequest, getMembership } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, serverError } from '../_lib/http.js';
import { rateLimit, readJson, requireAllowedOrigin } from '../_lib/security.js';

type Body = { memberId?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'DELETE') return methodNotAllowed(['DELETE']);
  const limited = rateLimit(request, 20);
  if (limited) return limited;
  const originError = requireAllowedOrigin(request);
  if (originError) return originError;

  try {
    const { user, admin } = await authenticateRequest(request);
    const membership = await getMembership(admin, user.id);
    if (!membership || membership.role !== 'admin') {
      return json({ error: 'Somente administradores podem remover membros.' }, 403);
    }

    const body = await readJson<Body>(request);
    const memberId = typeof body.memberId === 'string' ? body.memberId.trim().slice(0, 160) : '';
    if (!memberId) return json({ error: 'Informe o membro que será removido.' }, 400);

    const { data, error } = await admin.rpc('remove_workspace_member', {
      p_requester_id: user.id,
      p_workspace_id: membership.workspace_id,
      p_member_id: memberId,
    });
    if (error) {
      const message = error.message || '';
      if (/não encontrado/i.test(message)) return json({ error: 'Membro não encontrado.' }, 404);
      if (/último administrador|próprio acesso/i.test(message)) return json({ error: message }, 409);
      throw error;
    }

    return json({ removed: true, result: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande')) return json({ error: message }, 413);
    if (message.includes('Corpo da solicitação') || error instanceof SyntaxError) return json({ error: 'JSON inválido.' }, 400);
    if (message.includes('Token de autenticação ausente') || message.includes('Sessão inválida')) return json({ error: 'Não autenticado.' }, 401);
    if (/remove_workspace_member|schema cache/i.test(message)) return json({ error: 'A migration de segurança ainda não foi aplicada no Supabase.' }, 503);
    console.error('DELETE /api/team/members failed', error);
    return serverError();
  }
}
