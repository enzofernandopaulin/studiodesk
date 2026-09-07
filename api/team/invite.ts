import { getAdminClient, getMembership } from '../_lib/supabaseAdmin.js';

type InviteRole = 'admin' | 'gestor' | 'colaborador';
type Body = { name?: unknown; email?: unknown; jobTitle?: unknown; role?: unknown };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const origin = typeof request.headers?.origin === 'string' ? request.headers.origin.replace(/\/$/, '') : '';
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    if (origin && appUrl && origin !== appUrl) {
      return response.status(403).json({ error: 'Origem da solicitação não autorizada.' });
    }

    const authorization = typeof request.headers?.authorization === 'string' ? request.headers.authorization : '';
    const token = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
    if (!token) return response.status(401).json({ error: 'Não autenticado.' });

    const admin = getAdminClient();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return response.status(401).json({ error: 'Sessão inválida ou expirada.' });
    const user = authData.user;
    const inviter = await getMembership(admin, user.id);
    if (!inviter || inviter.role !== 'admin') {
      return response.status(403).json({ error: 'Somente administradores podem convidar membros.' });
    }

    const body: Body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim().slice(0, 120) : '';
    const role = body.role as InviteRole;
    if (!name || !EMAIL.test(email) || !jobTitle || !['admin', 'gestor', 'colaborador'].includes(role)) {
      return response.status(400).json({ error: 'Nome, e-mail, cargo e permissão válidos são obrigatórios.' });
    }

    if (!appUrl.startsWith('https://')) {
      return response.status(503).json({ error: 'APP_URL precisa conter a URL HTTPS do sistema na Vercel.' });
    }

    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: appUrl,
      data: { name, invited_workspace_id: inviter.workspace_id },
    });
    if (inviteError || !invite.user) {
      const duplicate = /already|registered|exists/i.test(inviteError?.message || '');
      return response.status(400).json({
        error: duplicate
          ? 'Este e-mail já possui uma conta. Use outro e-mail ou remova o usuário antigo antes de convidar.'
          : (inviteError?.message || 'Não foi possível enviar o convite.'),
      });
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
      user_id: invitedUserId,
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

    return response.status(201).json({
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('POST /api/team/invite failed', error);
    return response.status(500).json({
      error: process.env.VERCEL_ENV === 'production'
        ? 'Erro interno ao processar o convite.'
        : (message || 'Erro interno ao processar o convite.'),
    });
  }
}
