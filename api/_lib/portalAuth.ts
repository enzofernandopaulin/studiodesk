import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from './supabaseAdmin.js';

export const PORTAL_SESSION_COOKIE = 'studiodesk_portal_session';
export const PORTAL_CSRF_COOKIE = 'studiodesk_portal_csrf';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type CookieOptions = { httpOnly?: boolean; maxAge?: number };
export type PortalScope = {
  sessionId: string;
  accessId: string;
  workspaceId: string;
  projectId: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
};

function parseCookies(request: Request): Record<string, string> {
  return Object.fromEntries((request.headers.get('cookie') || '').split(';').map(part => {
    const index = part.indexOf('=');
    if (index < 0) return ['', ''];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function cookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'Secure', 'SameSite=Lax'];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
export function newToken(bytes = 32): string { return randomBytes(bytes).toString('base64url'); }
function accessSecret(): string {
  const secret = process.env.PORTAL_ACCESS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('PORTAL_ACCESS_SECRET não configurado.');
  return secret;
}
export function createPortalAccessKey(accessId: string): string {
  const encodedId = Buffer.from(accessId).toString('base64url');
  const signature = createHmac('sha256', accessSecret()).update(accessId).digest('base64url');
  return `p1_${encodedId}.${signature}`;
}
export function verifyPortalAccessKey(value: string): string | null {
  const [prefix, signature] = value.split('.');
  if (!prefix?.startsWith('p1_') || !signature) return null;
  try {
    const accessId = Buffer.from(prefix.slice(3), 'base64url').toString('utf8');
    const expected = createHmac('sha256', accessSecret()).update(accessId).digest('base64url');
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return accessId;
  } catch { return null; }
}
export function setCookieHeaders(sessionToken: string, csrfToken: string): string[] {
  return [cookie(PORTAL_SESSION_COOKIE, sessionToken, { httpOnly: true, maxAge: SESSION_TTL_SECONDS }), cookie(PORTAL_CSRF_COOKIE, csrfToken, { maxAge: SESSION_TTL_SECONDS })];
}
export function clearCookieHeaders(): string[] {
  return [cookie(PORTAL_SESSION_COOKIE, '', { httpOnly: true, maxAge: 0 }), cookie(PORTAL_CSRF_COOKIE, '', { maxAge: 0 })];
}
export function csrfTokenFromRequest(request: Request): string | null {
  const cookies = parseCookies(request);
  const header = request.headers.get('x-csrf-token');
  return header && cookies[PORTAL_CSRF_COOKIE] && header === cookies[PORTAL_CSRF_COOKIE] ? header : null;
}

export async function createPortalSession(admin: SupabaseClient, accessId: string, workspaceId: string) {
  const sessionToken = newToken();
  const csrfToken = newToken(24);
  const { data, error } = await admin.from('client_portal_sessions').insert({
    workspace_id: workspaceId,
    access_id: accessId,
    token_hash: hashToken(sessionToken),
    expires_at: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
  }).select('id').single();
  if (error) throw error;
  return { sessionId: data.id as string, sessionToken, csrfToken };
}

export async function getPortalScope(request: Request, admin: SupabaseClient = getAdminClient()): Promise<PortalScope | null> {
  const token = parseCookies(request)[PORTAL_SESSION_COOKIE];
  if (!token) return null;
  const { data: session, error: sessionError } = await admin.from('client_portal_sessions')
    .select('id, workspace_id, access_id, expires_at, revoked_at')
    .eq('token_hash', hashToken(token)).maybeSingle();
  if (sessionError || !session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const { data: access, error: accessError } = await admin.from('client_project_access')
    .select('id, workspace_id, project_id, client_id, is_active')
    .eq('id', session.access_id).eq('workspace_id', session.workspace_id).eq('is_active', true).maybeSingle();
  if (accessError || !access) return null;
  const { data: project, error: projectError } = await admin.from('projects')
    .select('id, workspace_id, client_id').eq('id', access.project_id).eq('workspace_id', access.workspace_id).eq('client_id', access.client_id).maybeSingle();
  if (projectError || !project) return null;
  const { data: client, error: clientError } = await admin.from('clients')
    .select('id, workspace_id, name, company').eq('id', access.client_id).eq('workspace_id', access.workspace_id).maybeSingle();
  if (clientError || !client) return null;
  await admin.from('client_portal_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', session.id).eq('workspace_id', session.workspace_id);
  return {
    sessionId: session.id,
    accessId: access.id,
    workspaceId: access.workspace_id,
    projectId: access.project_id,
    clientId: access.client_id,
    clientName: client.name,
    clientCompany: client.company,
  };
}

export async function revokePortalSession(request: Request, admin: SupabaseClient = getAdminClient()) {
  const token = parseCookies(request)[PORTAL_SESSION_COOKIE];
  if (!token) return;
  await admin.from('client_portal_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', hashToken(token));
}

export async function verifyPortalPassword(password: string, hash: string): Promise<boolean> {
  try { return await argon2.verify(hash, password); } catch { return false; }
}
export async function hashPortalPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}
