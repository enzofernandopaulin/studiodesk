import { getAdminClient } from '../_lib/supabaseAdmin';
import { json, methodNotAllowed, serverError } from '../_lib/http';
import { rateLimit, readJson } from '../_lib/security';
import { createHash, timingSafeEqual } from 'node:crypto';

type Body = { workspaceId?: unknown; name?: unknown; email?: unknown; phone?: unknown; whatsapp?: unknown; company?: unknown; serviceInterest?: unknown; source?: unknown; notes?: unknown; value?: unknown };
const text = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
function safeEqual(a: string, b: string) { const aa = createHash('sha256').update(a).digest(); const bb = createHash('sha256').update(b).digest(); return timingSafeEqual(aa, bb); }

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const limited = rateLimit(request, 30); if (limited) return limited;
  try {
    const expected = process.env.LEADS_WEBHOOK_SECRET;
    if (!expected) return json({ error: 'Webhook de leads não configurado.' }, 503);
    const supplied = request.headers.get('x-studiodesk-webhook-secret') || new URL(request.url).searchParams.get('token') || '';
    if (!supplied || !safeEqual(supplied, expected)) return json({ error: 'Webhook não autorizado.' }, 401);
    const body = await readJson<Body>(request);
    const workspaceId = text(body.workspaceId, 80); const name = text(body.name, 160);
    if (!workspaceId || !name) return json({ error: 'workspaceId e name são obrigatórios.' }, 400);
    const admin = getAdminClient();
    const { data: workspace, error: workspaceError } = await admin.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (workspaceError) throw workspaceError; if (!workspace) return json({ error: 'Workspace não encontrado.' }, 404);
    const sources = ['Site Institucional', 'Instagram', 'Indicação', 'WhatsApp Direto', 'Google', 'Outro'] as const;
    const requestedSource = text(body.source, 60); const source = sources.includes(requestedSource as any) ? requestedSource as typeof sources[number] : 'Outro';
    const { data, error } = await admin.from('leads').insert({ workspace_id: workspaceId, name, company: text(body.company, 160), email: text(body.email, 320), phone: text(body.phone, 40), whatsapp: text(body.whatsapp, 40), source, service_interest: text(body.serviceInterest, 200), assigned_to: '', notes: text(body.notes, 4000), status: 'novo', value: typeof body.value === 'number' && Number.isFinite(body.value) ? Math.max(0, body.value) : null }).select('id,name,status,created_at').single();
    if (error) throw error; return json({ received: true, lead: data }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande')) return json({ error: message }, 413);
    if (message.includes('Corpo da solicitação') || error instanceof SyntaxError) return json({ error: 'JSON inválido.' }, 400);
    console.error('POST /api/webhooks/leads failed', error); return serverError();
  }
}
