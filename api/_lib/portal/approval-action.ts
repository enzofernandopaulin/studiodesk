import { getAdminClient } from '../supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../http.js';
import { csrfTokenFromRequest, getPortalScope } from '../portalAuth.js';
import { readJson as readBody, rateLimit, requireAllowedOrigin } from '../security.js';

type Body = { approvalId?: unknown; action?: unknown; comment?: unknown };
const actions = new Set(['approve', 'reject', 'needs_revision', 'comment']);
export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  if (request.method !== 'POST') return sendWebResponse(methodNotAllowed(['POST']), response);
  const limited = rateLimit(webRequest, 30); if (limited) return sendWebResponse(limited, response);
  const originError = requireAllowedOrigin(webRequest); if (originError) return sendWebResponse(originError, response);
  if (!csrfTokenFromRequest(webRequest)) return sendWebResponse(json({ error: 'Validação CSRF inválida.' }, 403), response);
  try {
    const body = await readBody<Body>(webRequest);
    const approvalId = typeof body.approvalId === 'string' ? body.approvalId.trim() : '';
    const action = typeof body.action === 'string' ? body.action : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    if (!approvalId || !actions.has(action) || comment.length > 4000) return sendWebResponse(json({ error: 'Ação ou comentário inválido.' }, 400), response);
    const admin = getAdminClient();
    const scope = await getPortalScope(webRequest, admin);
    if (!scope) return sendWebResponse(json({ error: 'Sessão do Portal inválida ou expirada.' }, 401), response);
    const { data: approval, error: approvalError } = await admin.from('approval_requests').select('id,status').eq('id', approvalId).eq('workspace_id', scope.workspaceId).eq('project_id', scope.projectId).eq('client_id', scope.clientId).maybeSingle();
    if (approvalError) throw approvalError;
    if (!approval) return sendWebResponse(json({ error: 'Solicitação não encontrada neste projeto.' }, 404), response);
    if (approval.status === 'approved' || approval.status === 'rejected') {
      return sendWebResponse(json({ error: 'Esta solicitação já foi finalizada e não aceita novas alterações.' }, 409), response);
    }
    const result = await admin.rpc('apply_client_portal_approval_action', {
      p_workspace_id: scope.workspaceId,
      p_project_id: scope.projectId,
      p_client_id: scope.clientId,
      p_approval_id: approvalId,
      p_action: action,
      p_comment: comment,
      p_author: scope.clientName,
    });
    if (result.error) {
      if (result.error.code === 'PGRST202') return sendWebResponse(json({ error: 'A central de aprovação está aguardando a migration transacional do Portal.' }, 503), response);
      if (result.error.code === 'P0001' || result.error.code === 'P0002') return sendWebResponse(json({ error: 'A solicitação mudou de estado ou não pertence a este projeto.' }, 409), response);
      throw result.error;
    }
    return sendWebResponse(json({ ok: true }), response);
  } catch (error) { console.error('POST /api/portal/approval-action failed', error); return sendWebResponse(json({ error: 'Não foi possível registrar essa ação.' }, 500), response); }
}
