import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { sendWebResponse, toWebRequest } from '../_lib/http.js';
import { rateLimit, readJson, requireAllowedOrigin } from '../_lib/security.js';
import { createHash } from 'node:crypto';

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  const webRequest = toWebRequest(request);
  const limited = rateLimit(webRequest, 20);
  if (limited) return sendWebResponse(limited, response);
  const originError = requireAllowedOrigin(webRequest);
  if (originError) return sendWebResponse(originError, response);
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' });

  try {
    const accessToken = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !auth.user) return response.status(401).json({ error: 'Sessão inválida.' });

    const body = request.method === 'POST' ? await readJson<{ clientToken?: unknown }>(webRequest) : {};
    const clientToken = typeof body.clientToken === 'string' ? body.clientToken.trim() : '';

    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('id,workspace_id,plan,name,email,company_name,role,client_id').eq('id', auth.user.id).maybeSingle();
    if (profileError) throw profileError;

    if (/^[a-f0-9]{64}$/i.test(clientToken) && profile?.role !== 'cliente') {
      const tokenHash = createHash('sha256').update(clientToken).digest('hex');
      const { data: invitation, error: invitationError } = await admin.from('client_portal_invitations')
        .select('id,workspace_id,client_id,expires_at,max_uses,uses_count').eq('token_hash', tokenHash).maybeSingle();
      if (invitationError) throw invitationError;
      if (!invitation) return response.status(404).json({ error: 'Convite do portal não encontrado.' });
      if (invitation.uses_count >= invitation.max_uses || new Date(invitation.expires_at).getTime() < Date.now()) return response.status(410).json({ error: 'O convite do portal expirou ou já foi utilizado.' });
      const { data: existingMembership } = await admin.from('workspace_members').select('workspace_id,role').eq('workspace_id', invitation.workspace_id).eq('user_id', auth.user.id).maybeSingle();
      if (existingMembership && existingMembership.role !== 'cliente') return response.status(409).json({ error: 'Esta conta já pertence à equipe administrativa deste workspace.' });
      if (!existingMembership) {
        const { error: memberError } = await admin.from('workspace_members').insert({ workspace_id: invitation.workspace_id, user_id: auth.user.id, role: 'cliente' });
        if (memberError) throw memberError;
      }
      const { error: profileUpdateError } = await admin.from('profiles').update({ workspace_id: invitation.workspace_id, client_id: invitation.client_id, role: 'cliente', updated_at: new Date().toISOString() }).eq('id', auth.user.id);
      if (profileUpdateError) throw profileUpdateError;
      const { error: inviteUpdateError } = await admin.from('client_portal_invitations').update({ uses_count: invitation.uses_count + 1, accepted_by: auth.user.id, accepted_at: new Date().toISOString() }).eq('id', invitation.id);
      if (inviteUpdateError) throw inviteUpdateError;
    }

    const { data: memberships, error: membershipsError } = await admin.from('workspace_members')
      .select('workspace_id,role,created_at').eq('user_id', auth.user.id).order('created_at').limit(1);
    if (membershipsError) throw membershipsError;

    let membership = (memberships || [])[0] || null;
    if (!membership) {
      const workspaceName = String(auth.user.user_metadata?.company_name || 'Meu Workspace').trim().slice(0, 120) || 'Meu Workspace';
      const fallbackPlan = profile?.plan || 'individual';
      const { data: workspace, error: workspaceError } = await admin.from('workspaces')
        .insert({ name: workspaceName, owner_id: auth.user.id, plan: fallbackPlan }).select('id').single();
      if (workspaceError) throw workspaceError;

      const { data: createdMembership, error: memberError } = await admin.from('workspace_members')
        .insert({ workspace_id: workspace.id, user_id: auth.user.id, role: 'admin' })
        .select('workspace_id,role,created_at').single();
      if (memberError) throw memberError;
      membership = createdMembership;
    }

    const activeMembership = profile?.workspace_id
      ? await admin.from('workspace_members').select('workspace_id,role').eq('user_id', auth.user.id).eq('workspace_id', profile.workspace_id).maybeSingle()
      : { data: null, error: null };
    if (activeMembership.error) throw activeMembership.error;
    const active = activeMembership.data || membership;
      const { data: workspace, error: workspaceError } = await admin.from('workspaces')
        .select('name,plan').eq('id', active.workspace_id).single();
      if (workspaceError) throw workspaceError;

    if (!profile) {
      const { error: insertError } = await admin.from('profiles').insert({
        id: auth.user.id,
        workspace_id: active.workspace_id,
        name: String(auth.user.user_metadata?.name || auth.user.email?.split('@')[0] || ''),
        email: auth.user.email || '',
        company_name: workspace.name,
        role: active.role,
        plan: 'individual',
      });
      if (insertError) throw insertError;
    } else if (profile.workspace_id !== active.workspace_id || profile.company_name !== workspace.name || profile.role !== active.role || profile.plan !== workspace.plan) {
      const { error: updateError } = await admin.from('profiles').update({
        workspace_id: active.workspace_id,
        company_name: workspace.name,
        role: active.role,
        plan: workspace.plan,
        updated_at: new Date().toISOString(),
      }).eq('id', auth.user.id);
      if (updateError) throw updateError;
    }

    return response.status(200).json({ ready: true, workspaceId: active.workspace_id, plan: workspace.plan, role: active.role, clientId: profile?.client_id || null });
  } catch (error) {
    console.error('POST /api/session/bootstrap failed', error);
    const message = error instanceof Error ? error.message : '';
    if (/relation .* does not exist|schema cache/i.test(message)) {
      return response.status(503).json({ error: 'O banco do Supabase está incompleto. Execute os arquivos SQL de configuração.' });
    }
    return response.status(500).json({ error: 'Não foi possível preparar o perfil e o workspace desta conta.' });
  }
}
