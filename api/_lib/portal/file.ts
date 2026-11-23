import { getAdminClient } from '../supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../http.js';
import { getPortalScope } from '../portalAuth.js';
import { isSafeStoragePath } from '../security.js';
const BUCKET = 'studiodesk-files';
export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  if (request.method !== 'GET') return sendWebResponse(methodNotAllowed(['GET']), response);
  try {
    const scope = await getPortalScope(webRequest, getAdminClient());
    if (!scope) return sendWebResponse(json({ error: 'Sessão do Portal inválida ou expirada.' }, 401), response);
    const approvalId = new URL(webRequest.url).searchParams.get('approvalId') || '';
    const admin = getAdminClient();
    const { data: approval, error } = await admin.from('approval_requests').select('file_url').eq('id', approvalId).eq('workspace_id', scope.workspaceId).eq('project_id', scope.projectId).eq('client_id', scope.clientId).maybeSingle();
    if (error) throw error;
    if (!approval?.file_url) return sendWebResponse(json({ error: 'Arquivo não encontrado.' }, 404), response);
    const reference = approval.file_url as string;
    if (reference.startsWith('storage://')) {
      const raw = reference.slice('storage://'.length);
      const separator = raw.indexOf('/');
      const bucket = separator > 0 ? raw.slice(0, separator) : '';
      const path = separator > 0 ? raw.slice(separator + 1) : '';
      if (bucket !== BUCKET || !isSafeStoragePath(path, scope.workspaceId)) return sendWebResponse(json({ error: 'Arquivo não autorizado.' }, 403), response);
      const signed = await admin.storage.from(bucket).createSignedUrl(path, 900);
      if (signed.error || !signed.data?.signedUrl) return sendWebResponse(json({ error: 'Não foi possível gerar o acesso ao arquivo.' }, 502), response);
      return response.redirect(302, signed.data.signedUrl);
    }
    if (!/^https:\/\//i.test(reference)) return sendWebResponse(json({ error: 'Arquivo não autorizado.' }, 403), response);
    const configuredUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const trustedHost = configuredUrl ? new URL(configuredUrl).host : '';
    const directUrl = new URL(reference);
    if (!trustedHost || directUrl.host !== trustedHost || !directUrl.pathname.includes('/storage/v1/object/')) {
      return sendWebResponse(json({ error: 'Arquivo não autorizado.' }, 403), response);
    }
    return response.redirect(302, directUrl.toString());
  } catch (error) { console.error('GET /api/portal/file failed', error); return sendWebResponse(json({ error: 'Não foi possível abrir o arquivo.' }, 500), response); }
}
