import { authenticateRequest, getMembership } from './_lib/supabaseAdmin';
import { json, methodNotAllowed, serverError } from './_lib/http';
import { rateLimit } from './_lib/security';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const limited = rateLimit(request, 60);
  if (limited) return limited;

  try {
    const { user, admin } = await authenticateRequest(request);
    const membership = await getMembership(admin, user.id);

    if (!membership) return json({ error: 'Usuário não pertence a nenhum workspace.' }, 403);

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, name, email, avatar, role, plan, business_type, team_size, objectives, template, company_name, workspace_id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('GET /api/me profile lookup failed', error);
      return serverError();
    }

    return json({
      user: {
        id: user.id,
        email: user.email ?? null,
        profile,
        membership,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Token de autenticação ausente') || message.includes('Sessão inválida')) {
      return json({ error: 'Não autenticado.' }, 401);
    }
    console.error('GET /api/me failed', error);
    return serverError();
  }
}
