import { createHash } from 'node:crypto';
import { getAdminClient } from '../_lib/supabaseAdmin.js';

const PLAN_LIMITS: Record<string, number> = { individual: 1, solo: 1, studio: 10, empresa: 25, agencia: 50 };

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' });
  try {
    const accessToken = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !auth.user) return response.status(401).json({ error: 'Faça login ou crie uma conta para entrar na equipe.' });
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
    if (!/^[a-f0-9]{64}$/i.test(rawToken)) return response.status(400).json({ error: 'Link de convite inválido.' });
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const { data: invitation, error } = await admin.from('workspace_invitations')
      .select('id,workspace_id,email,role,expires_at,accepted_at,max_uses,uses_count')
      .eq('token_hash', tokenHash).maybeSingle();
    if (error || !invitation) return response.status(404).json({ error: 'Convite não encontrado.' });
    if (invitation.uses_count >= invitation.max_uses) return response.status(409).json({ error: 'Este convite atingiu o limite de entradas.' });
    if (new Date(invitation.expires_at).getTime() < Date.now()) return response.status(410).json({ error: 'Este convite expirou.' });
    if (invitation.email && invitation.email.toLowerCase() !== (auth.user.email || '').toLowerCase()) {
      return response.status(403).json({ error: 'Este convite foi criado para outro e-mail.' });
    }

    const { data: targetWorkspace, error: workspaceError } = await admin.from('workspaces').select('name,plan').eq('id', invitation.workspace_id).single();
    if (workspaceError) throw workspaceError;

    const { data: currentMembership } = await admin.from('workspace_members').select('role').eq('workspace_id', invitation.workspace_id).eq('user_id', auth.user.id).maybeSingle();
    if (currentMembership) {
      const { error: selectError } = await admin.from('profiles').update({
        workspace_id: invitation.workspace_id,
        company_name: targetWorkspace.name,
        role: currentMembership.role,
        updated_at: new Date().toISOString(),
      }).eq('id', auth.user.id);
      if (selectError) throw selectError;
      return response.status(200).json({ joined: true, alreadyMember: true, workspaceId: invitation.workspace_id, workspaceName: targetWorkspace.name });
    }

    const planLimit = PLAN_LIMITS[targetWorkspace.plan] || 1;
    const { count: membersCount, error: countError } = await admin.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', invitation.workspace_id);
    if (countError) throw countError;
    if ((membersCount || 0) >= planLimit) return response.status(409).json({ error: `Esta equipe atingiu o limite de ${planLimit} usuário(s) do plano atual.` });

    const { data: profile } = await admin.from('profiles').select('workspace_id,name,email').eq('id', auth.user.id).maybeSingle();
    const { error: memberError } = await admin.from('workspace_members').upsert({
      workspace_id: invitation.workspace_id, user_id: auth.user.id, role: invitation.role,
    }, { onConflict: 'workspace_id,user_id' });
    if (memberError) throw memberError;
    const { error: profileError } = await admin.from('profiles').update({
      workspace_id: invitation.workspace_id, company_name: targetWorkspace.name, role: invitation.role, updated_at: new Date().toISOString(),
    }).eq('id', auth.user.id);
    if (profileError) throw profileError;
    await admin.from('workspace_invitations').update({ accepted_by: auth.user.id, accepted_at: new Date().toISOString(), uses_count: invitation.uses_count + 1 }).eq('id', invitation.id).eq('uses_count', invitation.uses_count);
    await admin.from('team_members').upsert({
      id: `tm_${auth.user.id}`, workspace_id: invitation.workspace_id,
      name: profile?.name || auth.user.user_metadata?.name || auth.user.email || 'Membro',
      email: auth.user.email || '', role: 'Membro da equipe', access_level: invitation.role,
      avatar: '', projects_count: 0, status: 'ativo',
    }, { onConflict: 'workspace_id,id' });

    return response.status(200).json({ joined: true, workspaceId: invitation.workspace_id, workspaceName: targetWorkspace.name });
  } catch (error) {
    console.error('POST /api/team/join failed', error);
    return response.status(500).json({ error: 'Não foi possível entrar na equipe.' });
  }
}
