import { createHmac, timingSafeEqual } from 'node:crypto';
import { json } from './http';

const MAX_JSON_BYTES = 64 * 1024;
const MAX_STORAGE_PATH = 1024;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/** Best-effort per-instance limiter. Persistent limits belong in Supabase/Upstash/etc. */
export function rateLimit(request: Request, limit = 60, windowMs = 60_000): Response | null {
  const now = Date.now();
  const key = `${getClientIp(request)}:${new URL(request.url).pathname}`;
  const current = requestBuckets.get(key);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count > limit) {
    return json({ error: 'Muitas solicitações. Tente novamente em instantes.' }, 429, {
      'retry-after': String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))),
    });
  }
  return null;
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const allowed = (process.env.APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '')
    .split(',')
    .map(value => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (allowed.length === 0) {
    // Same-origin requests normally omit Origin for GETs. For state-changing browser
    // requests, require an explicit configured origin in production.
    return process.env.VERCEL_ENV !== 'production';
  }

  return allowed.includes(origin.replace(/\/$/, ''));
}

export function requireAllowedOrigin(request: Request): Response | null {
  if (!isAllowedOrigin(request)) {
    return json({ error: 'Origem da solicitação não autorizada.' }, 403);
  }
  return null;
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BYTES) {
    throw new Error('Payload muito grande.');
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) {
    throw new Error('Payload muito grande.');
  }

  if (!text.trim()) throw new Error('Corpo da solicitação ausente.');
  return JSON.parse(text) as T;
}

export function isSafeStoragePath(path: string, workspaceId: string): boolean {
  if (!path || path.length > MAX_STORAGE_PATH) return false;
  const normalized = path.replace(/^\/+/, '');
  const segments = normalized.split('/');
  return segments.length >= 2 &&
    segments[0] === workspaceId &&
    segments.every(segment => segment.length > 0 && segment !== '.' && segment !== '..');
}

export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const provided = signature.replace(/^sha256=/i, '').trim();
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
