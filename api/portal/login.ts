import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../_lib/http.js';
import { getClientIp, rateLimit, readJson as readBody, requireAllowedOrigin } from '../_lib/security.js';
import { createPortalSession, setCookieHeaders, verifyPortalAccessKey, verifyPortalPassword } from '../_lib/portalAuth.js';
type Body = { accessKey?: unknown; accessCode?: unknown };
export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  if (request.method !== 'POST') return sendWebResponse(methodNotAllowed(['POST']), response);
  const limited = rateLimit(webRequest, 12, 60_000); if (limited) return sendWebResponse(limited, response);
  const originError = requireAllowedOrigin(webRequest); if (originError) return sendWebResponse(originError, response);
  try {
    const body = await readBody<Body>(webRequest);
    const accessKey = typeof body.accessKey === 'string' ? body.accessKey.trim() : '';
    const accessCode = typeof body.accessCode === 'string' ? body.accessCode.trim() : '';
    const accessId = verifyPortalAccessKey(accessKey);
    if (!accessId || accessCode.length < 1 || accessCode.length > 256) return sendWebResponse(json({ error: 'Link de acesso ou código inválido.' }, 400), response);
    const admin = getAdminClient();
    const bucketKey = `${getClientIp(webRequest)}:${accessId}`.slice(0, 512);
    const distributedLimit = await admin.rpc('consume_client_portal_login_attempt', { p_bucket_key: bucketKey, p_limit: 8, p_window_seconds: 900 });
    if (distributedLimit.error) {
      const missing = distributedLimit.error.code === 'PGRST202' || /function .*consume_client_portal_login_attempt.*not found/i.test(distributedLimit.error.message || '');
      return sendWebResponse(json({ error: missing ? 'Portal temporariamente indisponível: o rate limit distribuído ainda precisa ser habilitado no banco.' : 'Portal temporariamente indisponível: não foi possível validar a proteção contra tentativas de login.' }, 503), response);
    }
    if (!distributedLimit.error && distributedLimit.data === false) return sendWebResponse(json({ error: 'Muitas tentativas de login. Tente novamente mais tarde.' }, 429, { 'retry-after': '900' }), response);
    const { data: access, error } = await admin.from('client_project_access')
      .select('id, workspace_id, project_id, client_id, password_hash, is_active')
      .eq('id', accessId).eq('is_active', true).maybeSingle();
    if (error) throw error;
    const valid = Boolean(access && await verifyPortalPassword(accessCode, access.password_hash));
    if (!valid) return sendWebResponse(json({ error: 'Não foi possível validar esses dados de acesso.' }, 401), response);
    const { sessionToken, csrfToken } = await createPortalSession(admin, access.id, access.workspace_id);
    response.setHeader('Set-Cookie', setCookieHeaders(sessionToken, csrfToken));
    return response.status(200).json({ ok: true, csrfToken });
  } catch (error) {
    console.error('POST /api/portal/login failed', error);
    if (error instanceof SyntaxError) return sendWebResponse(json({ error: 'JSON inválido.' }, 400), response);
    return sendWebResponse(json({ error: 'Não foi possível iniciar o Portal.' }, 500), response);
  }
}
