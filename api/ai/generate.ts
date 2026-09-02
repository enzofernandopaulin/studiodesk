import { authenticateRequest, getMembership } from '../_lib/supabaseAdmin';
import { json, methodNotAllowed, serverError } from '../_lib/http';
import { rateLimit, readJson, requireAllowedOrigin } from '../_lib/security';

const MAX_PROMPT = 12000;

type Body = { prompt?: unknown; system?: unknown; temperature?: unknown; maxOutputTokens?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const limited = rateLimit(request, 20);
  if (limited) return limited;
  const originError = requireAllowedOrigin(request);
  if (originError) return originError;

  try {
    const { user, admin } = await authenticateRequest(request);
    const membership = await getMembership(admin, user.id);
    if (!membership) return json({ error: 'Workspace não encontrado.' }, 403);

    const body = await readJson<Body>(request);
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return json({ error: 'Informe um prompt.' }, 400);
    if (prompt.length > MAX_PROMPT) return json({ error: 'Prompt muito grande.' }, 413);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: 'IA ainda não configurada no ambiente do servidor.' }, 503);

    const temperature = typeof body.temperature === 'number' && Number.isFinite(body.temperature)
      ? Math.min(Math.max(body.temperature, 0), 2) : 0.7;
    const maxOutputTokens = typeof body.maxOutputTokens === 'number' && Number.isFinite(body.maxOutputTokens)
      ? Math.min(Math.max(Math.floor(body.maxOutputTokens), 128), 4096) : 1024;
    const system = typeof body.system === 'string' ? body.system.trim().slice(0, 4000) : '';

    const contents = [
      ...(system ? [{ role: 'user', parts: [{ text: `Instruções do sistema:\n${system}` }] }] : []),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents, generationConfig: { temperature, maxOutputTokens } }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('Gemini request failed', response.status, detail.slice(0, 1000));
      return json({ error: 'O serviço de IA não respondeu corretamente.' }, 502);
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('')?.trim();
    if (!text) return json({ error: 'A IA não retornou conteúdo.' }, 502);

    return json({ text, model: 'gemini-2.5-flash' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande')) return json({ error: message }, 413);
    if (message.includes('Corpo da solicitação') || error instanceof SyntaxError) return json({ error: 'JSON inválido.' }, 400);
    if (message.includes('Token de autenticação ausente') || message.includes('Sessão inválida')) return json({ error: 'Não autenticado.' }, 401);
    console.error('POST /api/ai/generate failed', error);
    return serverError();
  }
}
