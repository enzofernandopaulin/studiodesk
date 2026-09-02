import { authenticateRequest, getMembership } from '../../_lib/supabaseAdmin';
import { json, methodNotAllowed, serverError } from '../../_lib/http';
import { rateLimit, readJson, requireAllowedOrigin } from '../../_lib/security';

type Body = { to?: unknown; subject?: unknown; html?: unknown; text?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const limited = rateLimit(request, 20); if (limited) return limited;
  const originError = requireAllowedOrigin(request); if (originError) return originError;
  try {
    const { user, admin } = await authenticateRequest(request);
    const membership = await getMembership(admin, user.id);
    if (!membership || !['admin', 'gestor'].includes(membership.role)) return json({ error: 'Sem permissão para enviar e-mails.' }, 403);
    const body = await readJson<Body>(request);
    const to = typeof body.to === 'string' ? body.to.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 200) : '';
    const html = typeof body.html === 'string' ? body.html.slice(0, 100_000) : '';
    const text = typeof body.text === 'string' ? body.text.slice(0, 20_000) : '';
    if (!/^\S+@\S+\.\S+$/.test(to) || !subject || (!html && !text)) return json({ error: 'Destinatário, assunto e conteúdo são obrigatórios.' }, 400);
    const apiKey = process.env.RESEND_API_KEY; const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) return json({ error: 'E-mail ainda não configurado no ambiente do servidor.' }, 503);
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ from, to: [to], subject, ...(html ? { html } : {}), ...(text ? { text } : {}) }) });
    if (!response.ok) { console.error('Email provider failed', response.status, (await response.text().catch(() => '')).slice(0, 1000)); return json({ error: 'O provedor de e-mail recusou o envio.' }, 502); }
    const data = await response.json().catch(() => ({})); return json({ sent: true, id: data?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande')) return json({ error: message }, 413);
    if (message.includes('Corpo da solicitação') || error instanceof SyntaxError) return json({ error: 'JSON inválido.' }, 400);
    if (message.includes('Token de autenticação ausente') || message.includes('Sessão inválida')) return json({ error: 'Não autenticado.' }, 401);
    console.error('POST /api/integrations/email/send failed', error); return serverError();
  }
}
