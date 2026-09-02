import { authenticateRequest, getMembership } from '../../_lib/supabaseAdmin';
import { json, methodNotAllowed, serverError } from '../../_lib/http';
import { rateLimit, readJson, requireAllowedOrigin } from '../../_lib/security';

type Body = { to?: unknown; message?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const limited = rateLimit(request, 20);
  if (limited) return limited;
  const originError = requireAllowedOrigin(request);
  if (originError) return originError;
  try {
    const { user, admin } = await authenticateRequest(request);
    const membership = await getMembership(admin, user.id);
    if (!membership || !['admin', 'gestor'].includes(membership.role)) return json({ error: 'Sem permissão para usar o WhatsApp.' }, 403);
    const body = await readJson<Body>(request);
    const to = typeof body.to === 'string' ? body.to.replace(/\D/g, '') : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!to || to.length < 10) return json({ error: 'Número de WhatsApp inválido.' }, 400);
    if (!message || message.length > 4000) return json({ error: 'Mensagem inválida.' }, 400);
    const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE;
    if (!baseUrl || !apiKey || !instance) return json({ error: 'WhatsApp ainda não configurado no ambiente do servidor.' }, 503);
    const response = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instance)}`, {
      method: 'POST', headers: { 'content-type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: to, text: message }),
    });
    if (!response.ok) { console.error('WhatsApp provider failed', response.status, (await response.text().catch(() => '')).slice(0, 1000)); return json({ error: 'O provedor de WhatsApp recusou o envio.' }, 502); }
    return json({ sent: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande')) return json({ error: message }, 413);
    if (message.includes('Corpo da solicitação') || error instanceof SyntaxError) return json({ error: 'JSON inválido.' }, 400);
    if (message.includes('Token de autenticação ausente') || message.includes('Sessão inválida')) return json({ error: 'Não autenticado.' }, 401);
    console.error('POST /api/integrations/whatsapp/send failed', error); return serverError();
  }
}
