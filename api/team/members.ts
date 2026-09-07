import { getAdminClient, getMembership } from '../_lib/supabaseAdmin.js';

type AccessLevel = 'admin' | 'gestor' | 'colaborador';

function bearerToken(request: any): string {
  return String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  try {
    const admin = getAdminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(bearerToken(request));
    if (authError || !auth.user) return response.status(401).json({ error: 'Sessão inválida.' });

    const actorMembership = await getMembership(admin, auth.user.id);
    if (!actorMembership) return response.status(403).json({ error: 'Você não pertence a um workspace.' });

    if (request.method === 'GET') {
      const { data: workspace, error: workspaceError } = await admin.from('workspaces')
        .select('id,name,owner_id,plan').eq('id', actorMembership.workspace_id).single();
      if (workspaceError) throw workspaceError;

      const { data: memberships, error: membershipsError } = await admin.from('workspace_members')
        .select('user_id,role,created_at')
        .eq('workspace_id', actorMembership.workspace_id)
        .order('created_at', { ascending: true });
      if (membershipsError) throw membershipsError;

      const userIds = (memberships || []).map(item => item.user_id);
      const [{ data: profiles, error: profilesError }, { data: directory, error: directoryError }] = userIds.length
        ? await Promise.all([
            admin.from('profiles').select('id,name,email,avatar').in('id', userIds),
            admin.from('team_members').select('id,name,email,role,avatar,projects_count,status,access_level').eq('workspace_id', actorMembership.workspace_id),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];
      if (profilesError) throw profilesError;
      if (directoryError) throw directoryError;

      const profileById = new Map((profiles || []).map(profile => [profile.id, profile]));
      const directoryByUserId = new Map((directory || []).map(item => [String(item.id).replace(/^tm_/, ''), item]));

      const members = (memberships || []).map(membership => {
        const profile = profileById.get(membership.user_id);
        const details = directoryByUserId.get(membership.user_id);
        const email = profile?.email || details?.email || '';
        return {
          id: `tm_${membership.user_id}`,
          userId: membership.user_id,
          name: profile?.name || details?.name || email.split('@')[0] || 'Membro',
          email,
          role: details?.role || (membership.user_id === workspace.owner_id ? 'Proprietário' : 'Membro da equipe'),
          accessLevel: membership.role as AccessLevel,
          avatar: profile?.avatar || details?.avatar || '',
          projectsCount: details?.projects_count || 0,
          status: 'ativo' as const,
          isOwner: membership.user_id === workspace.owner_id,
          joinedAt: membership.created_at,
        };
      });

      return response.status(200).json({
        workspace: { id: workspace.id, name: workspace.name, plan: workspace.plan },
        currentUserRole: actorMembership.role,
        members,
      });
    }

    if (request.method === 'DELETE') {
      if (actorMembership.role !== 'admin') {
        return response.status(403).json({ error: 'Somente administradores podem remover membros.' });
      }
      const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
      const targetUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
      if (!targetUserId) return response.status(400).json({ error: 'Membro inválido.' });
      if (targetUserId === auth.user.id) return response.status(409).json({ error: 'Você não pode remover sua própria conta por esta tela.' });

      const { data, error } = await admin.rpc('remove_workspace_member', {
        p_workspace_id: actorMembership.workspace_id,
        p_actor_user_id: auth.user.id,
        p_target_user_id: targetUserId,
      });
      if (error) throw error;
      return response.status(200).json(data);
    }

    response.setHeader('Allow', 'GET, DELETE');
    return response.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    console.error(`${request.method} /api/team/members failed`, error);
    const message = error instanceof Error ? error.message : '';
    if (/remove_workspace_member|schema cache|function .* does not exist/i.test(message)) {
      return response.status(503).json({ error: 'Execute supabase/EQUIPE-PROFISSIONAL.sql no Supabase.' });
    }
    const safeMessage = /administrador|proprietário|membro|workspace|conta/i.test(message) ? message : '';
    return response.status(500).json({ error: safeMessage || 'Não foi possível carregar a equipe.' });
  }
}
