import { authenticateRequest, getMembership } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, serverError } from '../_lib/http.js';
import { rateLimit, readJson, requireAllowedOrigin } from '../_lib/security.js';

type InviteRole = 'admin' | 'gestor' | 'colaborador';
type Body = { name?: unknown; email?: unknown; jobTitle?: unknown; role?: unknown };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const limited = rateLimit(request, 10);
  if (limited) return limited;
  const originError = requireAllowedOrigin(request);
  if (originError) return originError;

  try {
    const { user, admin } = await authenticateRequest(request);
    const inviter = await getMembership(admin, user.id);
    if (!inviter || inviter.role !== 'admin') {
      return json({ error: 'Somente administradores podem convidar membros.' }, 403);
    }

    const body = await readJson<Body>(request);
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim().slice(0, 120) : '';
    const role = body.role as InviteRole;
    if (!name || !EMAIL.test(email) || !jobTitle || !['admin', 'gestor', 'colaborador'].includes(role)) {
      return json({ error: 'Nome, e-mail, cargo e permissão válidos são obrigatórios.' }, 400);
    }

    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    if (!appUrl.startsWith('https://')) {
      return json({ error: 'APP_URL precisa conter a URL HTTPS do sistema na Vercel.' }, 503);
    }

    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: appUrl,
      data: { name, invited_workspace_id: inviter.workspace_id },
    });
    if (inviteError || !invite.user) {
      const duplicate = /already|registered|exists/i.test(inviteError?.message || '');
      return json({
        error: duplicate
          ? 'Este e-mail já possui uma conta. Use outro e-mail ou remova o usuário antigo antes de convidar.'
          : (inviteError?.message || 'Não foi possível enviar o convite.'),
      }, 400);
    }

    const invitedUserId = invite.user.id;
    const { data: temporaryProfile } = await admin
      .from('profiles')
      .select('workspace_id')
      .eq('id', invitedUserId)
      .maybeSingle();
    const temporaryWorkspaceId = temporaryProfile?.workspace_id as string | undefined;

    const { error: membershipError } = await admin.from('workspace_members').upsert({
      workspace_id: inviter.workspace_id,
      user_id: invitedUserId,
      role,
    }, { onConflict: 'workspace_id,user_id' });
    if (membershipError) throw membershipError;

    const { error: profileError } = await admin.from('profiles').update({
      workspace_id: inviter.workspace_id,
      name,
      email,
      role,
      updated_at: new Date().toISOString(),
    }).eq('id', invitedUserId);
    if (profileError) throw profileError;

    if (temporaryWorkspaceId && temporaryWorkspaceId !== inviter.workspace_id) {
      await admin.from('workspace_members').delete()
        .eq('workspace_id', temporaryWorkspaceId)
        .eq('user_id', invitedUserId);
      await admin.from('workspaces').delete().eq('id', temporaryWorkspaceId);
    }

    const member = {
      id: `tm_${invitedUserId}`,
      workspace_id: inviter.workspace_id,
      name,
      email,
      role: jobTitle,
      access_level: role,
      avatar: '',
      projects_count: 0,
      status: 'convidado',
    };
    const { error: teamError } = await admin.from('team_members').upsert(member, {
      onConflict: 'workspace_id,id',
    });
    if (teamError) throw teamError;

    return json({
      invited: true,
      member: {
        id: member.id,
        name,
        email,
        role: jobTitle,
        accessLevel: role,
        avatar: '',
        projectsCount: 0,
        status: 'convidado',
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Token de autenticação ausente') || message.includes('Sessão inválida')) {
      return json({ error: 'Não autenticado.' }, 401);
    }
    if (message.includes('Payload muito grande')) return json({ error: message }, 413);
    console.error('POST /api/team/invite failed', error);
    return serverError();
  }
}
