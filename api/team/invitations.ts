import { randomBytes, createHash } from 'node:crypto';
import { getAdminClient, getMembership } from '../_lib/supabaseAdmin.js';
import { sendInviteEmail } from '../_lib/email.js';

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

    const { data: workspacePlan, error: planLookupError } = await admin.from('workspaces').select('name,plan').eq('id', membership.workspace_id).single();
    if (planLookupError) throw planLookupError;
    const plan = workspacePlan?.plan || 'individual';
    const planLimit = PLAN_LIMITS[plan] || 1;
    const { count: membersCount, error: countError } = await admin.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', membership.workspace_id);
    if (countError) throw countError;
    const remainingSeats = Math.max(0, planLimit - (membersCount || 0));
    if (remainingSeats === 0) return response.status(409).json({ error: `O Plano ${plan} atingiu o limite de ${planLimit} usuário(s).` });

    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const recipientName = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim().slice(0, 120) : '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
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
      invited_name: recipientName || null,
      job_title: jobTitle || null,
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
      const { data: inviterProfile } = await admin.from('profiles').select('name').eq('id', auth.user.id).maybeSingle();
      try {
        await sendInviteEmail({
          to: email,
          recipientName,
          inviterName: inviterProfile?.name || auth.user.email || 'StudioDesk',
          workspaceName: teamName || workspacePlan.name || 'StudioDesk',
          role,
          inviteUrl,
        });
        emailSent = true;
      } catch (sendError) {
        console.error('Workspace invitation email failed', sendError);
        const sendMessage = sendError instanceof Error ? sendError.message : '';
        emailWarning = sendMessage.includes('RESEND_API_KEY_NOT_CONFIGURED')
          ? 'Configure RESEND_API_KEY na Vercel para enviar convites por e-mail.'
          : sendMessage.includes('INVITE_FROM_EMAIL_NOT_CONFIGURED')
            ? 'Configure INVITE_FROM_EMAIL na Vercel com um remetente autorizado.'
            : 'O provedor de e-mail recusou o envio. Confira o domínio e os logs da Resend.';
      }
    }

    return response.status(201).json({ inviteUrl, emailSent, emailWarning, expiresInDays: 7, maxUses: email ? 1 : remainingSeats, planLimit, remainingSeats });
  } catch (error) {
    console.error(`${request.method} /api/team/invitations failed`, error);
    const message = error instanceof Error ? error.message : '';
    if (/column .*plan|column .*invited_name|column .*job_title|schema cache/i.test(message)) {
      return response.status(503).json({ error: 'O banco ainda não recebeu a atualização de equipes. Execute supabase/MULTI-WORKSPACE.sql no Supabase.' });
    }
    if (/Configure uma URL Supabase válida|SUPABASE_SERVICE_ROLE_KEY/i.test(message)) {
      return response.status(503).json({ error: 'As variáveis privadas do Supabase não estão configuradas corretamente na Vercel.' });
    }
    return response.status(500).json({ error: request.method === 'GET' ? 'Não foi possível abrir este convite.' : 'Não foi possível criar o convite.' });
  }
}
