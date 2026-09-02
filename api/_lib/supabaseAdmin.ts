import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isServerSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

export function getAdminClient(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados na Vercel.');
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
  const { data, error } = await admin
    .from('workspace_members')
    .select('workspace_id, role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
