import { authenticateRequest, getMembership } from '../_lib/supabaseAdmin';
import { json, methodNotAllowed, serverError } from '../_lib/http';
import { isSafeStoragePath, rateLimit, readJson, requireAllowedOrigin } from '../_lib/security';

const DEFAULT_EXPIRATION = 3600;
const MAX_EXPIRATION = 3600;
const BUCKET = 'studiodesk-files';

type Body = { path?: unknown; expiresIn?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);

  const limited = rateLimit(request, 30);
  if (limited) return limited;

  const originError = requireAllowedOrigin(request);
  if (originError) return originError;

  try {
    const { user, admin } = await authenticateRequest(request);
    const membership = await getMembership(admin, user.id);
    if (!membership) return json({ error: 'Workspace não encontrado.' }, 403);

    const body = await readJson<Body>(request);
    const path = typeof body.path === 'string' ? body.path.trim() : '';
    if (!isSafeStoragePath(path, membership.workspace_id)) {
      return json({ error: 'Arquivo inválido para o workspace atual.' }, 400);
    }

    const requestedExpiration = Number(body.expiresIn);
    const expiresIn = Number.isFinite(requestedExpiration)
      ? Math.min(Math.max(Math.floor(requestedExpiration), 60), MAX_EXPIRATION)
      : DEFAULT_EXPIRATION;

    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('POST /api/storage/signed-url failed', error);
      return serverError();
    }

    return json({ signedUrl: data.signedUrl, expiresIn });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande')) return json({ error: message }, 413);
    if (message.includes('Corpo da solicitação') || error instanceof SyntaxError) {
      return json({ error: 'JSON inválido.' }, 400);
    }
    if (message.includes('Token de autenticação ausente') || message.includes('Sessão inválida')) {
      return json({ error: 'Não autenticado.' }, 401);
    }
    console.error('POST /api/storage/signed-url unexpected failure', error);
    return serverError();
  }
}
