import { json, methodNotAllowed, sendWebResponse, toWebRequest } from './_lib/http.js';
import { rateLimit } from './_lib/security.js';

async function webHandler(request: Request): Promise<Response> {
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

export default async function handler(request: any, response: any) {
  return sendWebResponse(await webHandler(toWebRequest(request)), response);
}
