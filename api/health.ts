import { json, methodNotAllowed } from './_lib/http';
import { rateLimit } from './_lib/security';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const limited = rateLimit(request, 30);
  if (limited) return limited;

  return json({
    ok: true,
    service: 'studiodesk-api',
    serverless: true,
    timestamp: new Date().toISOString(),
  });
}
