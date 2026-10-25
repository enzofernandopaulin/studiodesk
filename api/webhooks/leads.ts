import { randomUUID } from 'node:crypto';
import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, serverError, toWebRequest } from '../_lib/http.js';
import { isFreshWebhookTimestamp, readJson, verifyHmacSignature } from '../_lib/security.js';
import { distributedRateLimit } from '../_lib/distributedRateLimit.js';

export const config = {
  api: {
    // A assinatura deve ser calculada sobre os bytes exatos enviados pela Dumonti.
    bodyParser: false,
  },
};

type Body = {
  workspaceId?: unknown;
  idempotencyKey?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  whatsapp?: unknown;
  company?: unknown;
  serviceInterest?: unknown;
  source?: unknown;
  notes?: unknown;
  value?: unknown;
};

const MAX_BODY_BYTES = 64 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const isUuid = (value: string): boolean => UUID_RE.test(value);

function canonicalSource(value: unknown): string {
  const source = text(value, 80);
  if (source === 'Site Institucional' || source === 'Site Institucional (Formulário)') {
    return 'Site Institucional (Formulário)';
  }
  const allowed = ['Instagram', 'Indicação', 'WhatsApp Direto', 'Google', 'Outro'] as const;
  return allowed.includes(source as (typeof allowed)[number]) ? source : 'Outro';
}

async function toRawBodyRequest(nodeRequest: any, headerRequest: Request): Promise<Request> {
  if (nodeRequest.body != null) {
    throw new Error('Corpo bruto indisponível; confirme api.bodyParser=false.');
  }

  const declaredLength = Number(headerRequest.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new Error('Payload muito grande.');
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  if (nodeRequest.method !== 'GET' && nodeRequest.method !== 'HEAD') {
    for await (const chunk of nodeRequest) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.byteLength;
      if (totalBytes > MAX_BODY_BYTES) throw new Error('Payload muito grande.');
      chunks.push(buffer);
    }
  }

  const body = Buffer.concat(chunks, totalBytes);
  const init: RequestInit & { duplex?: 'half' } = {
    method: headerRequest.method,
    headers: headerRequest.headers,
    body: headerRequest.method === 'GET' || headerRequest.method === 'HEAD' ? undefined : body,
    duplex: 'half',
  };
  return new Request(headerRequest.url, init);
}

async function webHandler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);

  try {
    const secret = process.env.LEADS_WEBHOOK_SECRET?.trim() || '';
    if (secret.length < 32) return json({ error: 'Webhook de leads não configurado.' }, 503);

    const timestamp = request.headers.get('x-studiodesk-webhook-timestamp') || '';
    const signature = request.headers.get('x-studiodesk-webhook-signature') || '';
    const rawBody = await request.clone().text();
    if (!isFreshWebhookTimestamp(timestamp, 300) || !verifyHmacSignature(`${timestamp}.${rawBody}`, signature, secret)) {
      return json({ error: 'Webhook não autorizado.' }, 401);
    }

    const body = await readJson<Body>(request);
    const workspaceId = text(body.workspaceId, 36);
    const name = text(body.name, 160);
    const company = text(body.company, 160);
    const email = text(body.email, 320).toLowerCase();
    const phone = text(body.phone, 40);
    const whatsapp = text(body.whatsapp, 40);
    const serviceInterest = text(body.serviceInterest, 200);
    const notes = text(body.notes, 4000);
    const idempotencyKey = text(body.idempotencyKey, 128);

    if (!isUuid(workspaceId)) return json({ error: 'workspaceId inválido.' }, 400);
    if (name.length < 2) return json({ error: 'Informe o nome do contato.' }, 400);
    if (company.length < 2) return json({ error: 'Informe a empresa ou negócio.' }, 400);
    if (email && (email.length > 320 || !EMAIL_RE.test(email))) return json({ error: 'E-mail inválido.' }, 400);
    if (!email && !phone && !whatsapp) return json({ error: 'Informe e-mail ou telefone/WhatsApp.' }, 400);
    if (serviceInterest.length < 2) return json({ error: 'Informe o serviço de interesse.' }, 400);
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
      return json({ error: 'idempotencyKey ausente ou inválida.' }, 400);
    }

    const configuredWorkspace = process.env.LEADS_WEBHOOK_WORKSPACE_ID?.trim() || '';
    if (!isUuid(configuredWorkspace)) return json({ error: 'Workspace do webhook não configurado.' }, 503);
    if (workspaceId !== configuredWorkspace) return json({ error: 'Workspace não autorizado.' }, 403);

    const admin = getAdminClient();
    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return json({ error: 'Workspace não encontrado.' }, 404);

    const leadPayload = {
      id: randomUUID(),
      workspace_id: workspaceId,
      idempotency_key: idempotencyKey,
      name,
      company,
      email,
      phone,
      whatsapp: whatsapp || phone,
      source: canonicalSource(body.source),
      service_interest: serviceInterest,
      assigned_to: '',
      notes,
      status: 'novo',
      value: typeof body.value === 'number' && Number.isFinite(body.value) && body.value >= 0 ? body.value : null,
    };

    const { data, error } = await admin
      .from('leads')
      .insert(leadPayload)
      .select('id,name,status,created_at')
      .maybeSingle();

    if (!error && data) return json({ received: true, duplicate: false, lead: data }, 201);

    if (error?.code === '23505') {
      const { data: existing, error: existingError } = await admin
        .from('leads')
        .select('id,name,status,created_at')
        .eq('workspace_id', workspaceId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return json({ received: true, duplicate: true, lead: existing }, 200);
    }

    if (error) throw error;
    return serverError();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande')) return json({ error: 'Payload muito grande.' }, 413);
    if (message.includes('Corpo') || error instanceof SyntaxError) return json({ error: 'JSON inválido.' }, 400);
    console.error('POST /api/webhooks/leads failed', error);
    return serverError();
  }
}

export default async function handler(nodeRequest: any, nodeResponse: any) {
  const headerRequest = toWebRequest(nodeRequest);
  if (headerRequest.method !== 'POST') {
    return sendWebResponse(methodNotAllowed(['POST']), nodeResponse);
  }

  const limited = await distributedRateLimit(headerRequest, 30, 60);
  if (limited) return sendWebResponse(limited, nodeResponse);

  try {
    const request = await toRawBodyRequest(nodeRequest, headerRequest);
    return sendWebResponse(await webHandler(request), nodeResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const response = message.includes('Payload muito grande')
      ? json({ error: 'Payload muito grande.' }, 413)
      : json({ error: 'Não foi possível ler o corpo bruto do webhook.' }, 400);
    return sendWebResponse(response, nodeResponse);
  }
}
