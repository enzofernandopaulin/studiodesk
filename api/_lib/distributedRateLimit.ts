import { json } from './http.js';

const LUA = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n";

function clientIp(request: Request): string {
  return (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
    .split(',')[0]
    .trim()
    .slice(0, 100);
}

export async function distributedRateLimit(
  request: Request,
  limit = 30,
  windowSeconds = 60,
): Promise<Response | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const production = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  if (!url || !token) {
    return production ? json({ error: 'Rate limiting não configurado.' }, 503) : null;
  }

  try {
    const response = await fetch(url.replace(/\/$/, ''), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', LUA, '1', `studiodesk-leads:${clientIp(request)}`, String(windowSeconds)]),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) throw new Error('rate limiter unavailable');
    const payload = await response.json() as { result?: unknown };
    const count = Number(payload.result);
    if (!Number.isFinite(count)) throw new Error('invalid rate limiter response');
    if (count > limit) {
      return json({ error: 'Muitas solicitações. Tente novamente em instantes.' }, 429, {
        'retry-after': String(windowSeconds),
      });
    }
    return null;
  } catch {
    return production ? json({ error: 'Rate limiting temporariamente indisponível.' }, 503) : null;
  }
}
