export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export function methodNotAllowed(allowed: string[]): Response {
  return json({ error: 'Método não permitido.' }, 405, {
    allow: allowed.join(', '),
  });
}

export function serverError(): Response {
  return json({ error: 'Erro interno do servidor.' }, 500);
}

/** Adapta o request Node entregue pela Vercel para as rotinas Web API internas. */
export function toWebRequest(request: any): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers || {})) {
    if (Array.isArray(value)) headers.set(key, value.join(', '));
    else if (value != null) headers.set(key, String(value));
  }
  const protocol = headers.get('x-forwarded-proto') || 'https';
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost';
  const url = new URL(String(request.url || '/'), `${protocol}://${host}`).toString();
  const method = String(request.method || 'GET').toUpperCase();
  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'HEAD' && request.body != null) {
    if (typeof request.body === 'string' || request.body instanceof Uint8Array) body = request.body;
    else body = JSON.stringify(request.body);
  }
  return new Request(url, { method, headers, body });
}

/** Entrega uma Response Web usando o response Node da Vercel. */
export async function sendWebResponse(response: Response, nodeResponse: any) {
  response.headers.forEach((value, key) => nodeResponse.setHeader(key, value));
  return nodeResponse.status(response.status).send(await response.text());
}
