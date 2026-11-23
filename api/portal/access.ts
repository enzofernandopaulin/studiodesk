import { authenticateRequest, getMembership } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../_lib/http.js';
import { readJson, rateLimit, requireAllowedOrigin } from '../_lib/security.js';
import { createPortalAccessKey, hashPortalPassword, newToken } from '../_lib/portalAuth.js';
type Body = { workspaceId?: unknown; projectId?: unknown; clientId?: unknown; accessId?: unknown };
function isManager(role: string): boolean { return role === 'admin' || role === 'gestor'; }
export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return sendWebResponse(methodNotAllowed(['GET', 'POST', 'DELETE']), response);
  const limited = rateLimit(webRequest, 30); if (limited) return sendWebResponse(limited, response);
  const originError = requireAllowedOrigin(webRequest); if (originError) return sendWebResponse(originError, response);
  try {
    const { user, admin } = await authenticateRequest(webRequest);
    const membership = await getMembership(admin, user.id);
    if (!membership || !isManager(membership.role)) return sendWebResponse(json({ error: 'Apenas administradores e gestores podem gerenciar acessos do Portal.' }, 403), response);
    if (request.method === 'GET') {
      const clientId = new URL(webRequest.url).searchParams.get('clientId')?.trim() || '';
      const projectId = new URL(webRequest.url).searchParams.get('projectId')?.trim() || '';
      let query = admin.from('client_project_access').select('id,workspace_id,project_id,client_id,is_active,created_at,updated_at').eq('workspace_id', membership.workspace_id);
      if (clientId) query = query.eq('client_id', clientId);
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query.order('updated_at', { ascending: false }).limit(100);
      if (error) throw error;
      return sendWebResponse(json({ accesses: data || [] }), response);
    }
    const body = await readJson<Body>(webRequest);
    const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : membership.workspace_id;
    if (workspaceId !== membership.workspace_id) return sendWebResponse(json({ error: 'Workspace não autorizado.' }, 403), response);
    if (request.method === 'DELETE') {
      const accessId = typeof body.accessId === 'string' ? body.accessId.trim() : '';
      if (!accessId) return sendWebResponse(json({ error: 'accessId é obrigatório.' }, 400), response);
      const { data: access, error: accessError } = await admin.from('client_project_access').select('id').eq('id', accessId).eq('workspace_id', workspaceId).maybeSingle();
      if (accessError) throw accessError;
      if (!access) return sendWebResponse(json({ error: 'Acesso não encontrado.' }, 404), response);
      const { error } = await admin.from('client_project_access').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', accessId).eq('workspace_id', workspaceId);
      if (error) throw error;
      await admin.from('client_portal_sessions').update({ revoked_at: new Date().toISOString() }).eq('access_id', accessId).eq('workspace_id', workspaceId).is('revoked_at', null);
      return sendWebResponse(json({ ok: true }), response);
    }
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
    const clientId = typeof body.clientId === 'string' ? body.clientId.trim() : '';
    if (!projectId || !clientId) return sendWebResponse(json({ error: 'Projeto e cliente são obrigatórios.' }, 400), response);
    const [{ data: project, error: projectError }, { data: client, error: clientError }] = await Promise.all([
      admin.from('projects').select('id,workspace_id,client_id').eq('id', projectId).eq('workspace_id', workspaceId).eq('client_id', clientId).maybeSingle(),
      admin.from('clients').select('id,workspace_id').eq('id', clientId).eq('workspace_id', workspaceId).maybeSingle(),
    ]);
    if (projectError || clientError) throw projectError || clientError;
    if (!project || !client) return sendWebResponse(json({ error: 'Projeto e cliente não formam um vínculo válido neste workspace.' }, 400), response);
    const accessCode = newToken(12);
    const passwordHash = await hashPortalPassword(accessCode);
    const { data: access, error } = await admin.from('client_project_access').upsert({ workspace_id: workspaceId, project_id: projectId, client_id: clientId, password_hash: passwordHash, is_active: true, updated_at: new Date().toISOString() }, { onConflict: 'workspace_id,project_id' }).select('id,workspace_id,project_id,client_id,is_active,created_at,updated_at').single();
    if (error) throw error;
    const accessKey = createPortalAccessKey(access.id);
    const appUrl = (process.env.APP_URL || new URL(webRequest.url).origin).replace(/\/$/, '');
    return sendWebResponse(json({ access, accessCode, portalUrl: `${appUrl}/portal?access=${encodeURIComponent(accessKey)}` }), response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/Token de autenticação ausente|Sessão inválida/.test(message)) return sendWebResponse(json({ error: 'Não autenticado.' }, 401), response);
    if (message.includes('Payload muito grande') || message.includes('Corpo da solicitação') || error instanceof SyntaxError) return sendWebResponse(json({ error: 'Payload inválido.' }, 400), response);
    console.error(`${request.method} /api/portal/access failed`, error);
    return sendWebResponse(json({ error: 'Não foi possível atualizar o acesso do Portal.' }, 500), response);
  }
}
