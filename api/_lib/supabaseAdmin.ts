import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

function cleanEnv(value: string | undefined): string {
  return (value || '').trim().replace(/^['"]|['"]$/g, '').trim();
}

function validSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

const serverUrl = cleanEnv(process.env.SUPABASE_URL);
const publicUrl = cleanEnv(process.env.VITE_SUPABASE_URL);
const supabaseUrl = validSupabaseUrl(serverUrl) ? serverUrl : (validSupabaseUrl(publicUrl) ? publicUrl : '');
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const isServerSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

export function getAdminClient(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configure uma URL Supabase válida em SUPABASE_URL ou VITE_SUPABASE_URL e confira SUPABASE_SERVICE_ROLE_KEY na Vercel.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function authenticateRequest(request: Request): Promise<{ user: User; admin: SupabaseClient }> {
  const token = getBearerToken(request);
  if (!token) throw new Error('Token de autenticação ausente.');

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error('Sessão inválida ou expirada.');

  return { user: data.user, admin };
}

export async function getMembership(admin: SupabaseClient, userId: string) {
  const { data: profile } = await admin.from('profiles').select('workspace_id').eq('id', userId).maybeSingle();
  let query = admin
    .from('workspace_members')
    .select('workspace_id, role, created_at')
    .eq('user_id', userId);
  if (profile?.workspace_id) query = query.eq('workspace_id', profile.workspace_id);
  const { data, error } = await query.order('created_at', { ascending: true }).limit(1).maybeSingle();

  if (error) throw error;
  if (!data && profile?.workspace_id) {
    const fallback = await admin.from('workspace_members').select('workspace_id, role, created_at').eq('user_id', userId).order('created_at').limit(1).maybeSingle();
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }
  return data;
}
