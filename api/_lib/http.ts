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
