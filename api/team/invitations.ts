import { randomBytes, createHash } from 'node:crypto';
import { getAdminClient, getMembership } from '../_lib/supabaseAdmin.js';

type Role = 'admin' | 'gestor' | 'colaborador';

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' });
  try {
    const token = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return response.status(401).json({ error: 'Sessão inválida.' });
    const membership = await getMembership(admin, auth.user.id);
    if (!membership || membership.role !== 'admin') return response.status(403).json({ error: 'Somente administradores podem criar convites.' });

    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const teamName = typeof body.teamName === 'string' ? body.teamName.trim().slice(0, 120) : '';
    const role: Role = ['admin','gestor','colaborador'].includes(body.role) ? body.role : 'colaborador';
    const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
    if (!appUrl.startsWith('https://')) return response.status(503).json({ error: 'APP_URL não está configurada corretamente.' });
    if (teamName) {
      const { error: nameError } = await admin.from('workspaces').update({ name: teamName, updated_at: new Date().toISOString() }).eq('id', membership.workspace_id);
      if (nameError) throw nameError;
      await admin.from('profiles').update({ company_name: teamName, updated_at: new Date().toISOString() }).eq('workspace_id', membership.workspace_id);
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const { error: insertError } = await admin.from('workspace_invitations').insert({
      workspace_id: membership.workspace_id,
      token_hash: tokenHash,
      email: email || null,
      role,
      created_by: auth.user.id,
      max_uses: email ? 1 : 25,
    });
    if (insertError) {
      if (/workspace_invitations/i.test(insertError.message)) return response.status(503).json({ error: 'Execute supabase/TEAM-INVITES.sql no Supabase antes de criar convites.' });
      throw insertError;
    }

    const inviteUrl = `${appUrl}/?team_invite=${rawToken}`;
    let emailSent = false;
    let emailWarning = '';
    if (email) {
      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteUrl,
        data: { invited_workspace_id: membership.workspace_id },
      });
      emailSent = !error;
      if (error) emailWarning = /already|registered|exists/i.test(error.message)
        ? 'O e-mail já possui conta. Copie e envie o link diretamente para essa pessoa.'
        : error.message;
    }

    return response.status(201).json({ inviteUrl, emailSent, emailWarning, expiresInDays: 7, maxUses: email ? 1 : 25 });
  } catch (error) {
    console.error('POST /api/team/invitations failed', error);
    return response.status(500).json({ error: 'Não foi possível criar o convite.' });
  }
}
