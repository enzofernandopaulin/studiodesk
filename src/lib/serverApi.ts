import { supabase } from './supabase';

export async function callServerApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabase) throw new Error('Supabase não está configurado.');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sessão não encontrada.');

  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'A API do StudioDesk retornou um erro.');
  return payload as T;
}

export function getServerProfile() {
  return callServerApi<{
    user: {
      id: string;
      email: string | null;
      profile: Record<string, unknown> | null;
      membership: { workspace_id: string; role: string };
    };
  }>('/api/me');
}
