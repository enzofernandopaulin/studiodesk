import { randomBytes, createHash } from 'node:crypto';
import { getAdminClient, getMembership } from '../_lib/supabaseAdmin.js';

type Role = 'admin' | 'gestor' | 'colaborador';
const PLAN_LIMITS: Record<string, number> = { individual: 1, solo: 1, studio: 10, empresa: 25, agencia: 50 };

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  try {
    if (request.method === 'GET') {
      const rawQueryToken = Array.isArray(request.query?.token) ? request.query.token[0] : request.query?.token;
      const rawToken = typeof rawQueryToken === 'string' ? rawQueryToken.trim() : '';
      if (!/^[a-f0-9]{64}$/i.test(rawToken)) return response.status(400).json({ error: 'Link de convite inválido.' });

      const admin = getAdminClient();
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const { data: invitation, error } = await admin.from('workspace_invitations')
        .select('workspace_id,role,email,expires_at,max_uses,uses_count')
        .eq('token_hash', tokenHash).maybeSingle();
      if (error || !invitation) return response.status(404).json({ error: 'Convite não encontrado.' });
      if (invitation.uses_count >= invitation.max_uses) return response.status(409).json({ error: 'Este convite atingiu o limite de entradas.' });
      if (new Date(invitation.expires_at).getTime() < Date.now()) return response.status(410).json({ error: 'Este convite expirou.' });

      const { data: workspace, error: workspaceError } = await admin.from('workspaces')
        .select('name').eq('id', invitation.workspace_id).single();
      if (workspaceError) throw workspaceError;
      return response.status(200).json({
        workspaceName: workspace.name,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        emailRestricted: Boolean(invitation.email),
      });
    }

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'GET, POST');
      return response.status(405).json({ error: 'Método não permitido.' });
    }

    const token = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return response.status(401).json({ error: 'Sessão inválida.' });
    const membership = await getMembership(admin, auth.user.id);
    if (!membership || membership.role !== 'admin') return response.status(403).json({ error: 'Somente administradores podem criar convites.' });

    const { data: ownerProfile, error: profileLookupError } = await admin.from('profiles').select('plan').eq('id', auth.user.id).maybeSingle();
    if (profileLookupError) throw profileLookupError;
    const plan = ownerProfile?.plan || 'individual';
    const planLimit = PLAN_LIMITS[plan] || 1;
    const { count: membersCount, error: countError } = await admin.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', membership.workspace_id);
    if (countError) throw countError;
    const remainingSeats = Math.max(0, planLimit - (membersCount || 0));
    if (remainingSeats === 0) return response.status(409).json({ error: `O Plano ${plan} atingiu o limite de ${planLimit} usuário(s).` });

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
      max_uses: email ? 1 : remainingSeats,
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

    return response.status(201).json({ inviteUrl, emailSent, emailWarning, expiresInDays: 7, maxUses: email ? 1 : remainingSeats, planLimit, remainingSeats });
  } catch (error) {
    console.error(`${request.method} /api/team/invitations failed`, error);
    return response.status(500).json({ error: 'Não foi possível criar o convite.' });
  }
}
