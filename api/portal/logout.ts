import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../_lib/http.js';
import { clearCookieHeaders, csrfTokenFromRequest, revokePortalSession } from '../_lib/portalAuth.js';
import { requireAllowedOrigin } from '../_lib/security.js';
export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  if (request.method !== 'POST') return sendWebResponse(methodNotAllowed(['POST']), response);
  const originError = requireAllowedOrigin(webRequest); if (originError) return sendWebResponse(originError, response);
  if (!csrfTokenFromRequest(webRequest)) return sendWebResponse(json({ error: 'Validação CSRF inválida.' }, 403), response);
  try { await revokePortalSession(webRequest, getAdminClient()); response.setHeader('Set-Cookie', clearCookieHeaders()); return response.status(200).json({ ok: true }); }
  catch (error) { console.error('POST /api/portal/logout failed', error); return sendWebResponse(json({ error: 'Não foi possível encerrar a sessão.' }, 500), response); }
}
