import { authenticateRequest, getMembership } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../_lib/http.js';
import { rateLimit, requireAllowedOrigin } from '../_lib/security.js';

const VALID_PLANS = new Set(['individual', 'solo', 'studio', 'empresa', 'agencia']);

export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  const limited = rateLimit(webRequest, 20);
  if (limited) return sendWebResponse(limited, response);
  const originError = requireAllowedOrigin(webRequest);
  if (originError) return sendWebResponse(originError, response);
  if (request.method !== 'POST') return sendWebResponse(methodNotAllowed(['POST']), response);

  try {
    const { user, admin } = await authenticateRequest(webRequest);
    const body = await webRequest.json().catch(() => ({})) as { plan?: unknown };
    const plan = typeof body.plan === 'string' ? body.plan.trim() : '';
    if (!VALID_PLANS.has(plan)) return sendWebResponse(json({ error: 'Plano inválido.' }, 400), response);

    const membership = await getMembership(admin, user.id);
    if (!membership || !['admin', 'gestor'].includes(membership.role)) {
      return sendWebResponse(json({ error: 'Sem permissão para alterar o plano.' }, 403), response);
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (profileError) throw profileError;

    const { error: workspaceError } = await admin
      .from('workspaces')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', membership.workspace_id)
      .eq('owner_id', user.id);
    if (workspaceError) throw workspaceError;

    return sendWebResponse(json({ updated: true, plan, workspaceId: membership.workspace_id }), response);
  } catch (error) {
    console.error('POST /api/session/set-plan failed', error);
    const message = error instanceof Error ? error.message : '';
    return sendWebResponse(json({ error: message || 'Não foi possível salvar o plano escolhido.' }, 500), response);
  }
}
