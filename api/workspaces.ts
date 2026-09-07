import { getAdminClient } from './_lib/supabaseAdmin.js';

async function authenticate(request: any) {
  const accessToken = String(request.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) return { admin, user: null };
  return { admin, user: data.user };
}

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  try {
    const { admin, user } = await authenticate(request);
    if (!user) return response.status(401).json({ error: 'Sessão inválida.' });

    if (request.method === 'GET') {
      const { data: profile } = await admin.from('profiles').select('workspace_id').eq('id', user.id).maybeSingle();
      const { data: memberships, error } = await admin.from('workspace_members').select('workspace_id,role,created_at').eq('user_id', user.id).order('created_at');
      if (error) throw error;
      const ids = (memberships || []).map(item => item.workspace_id);
      const { data: workspaces, error: workspaceError } = ids.length
        ? await admin.from('workspaces').select('id,name,created_at').in('id', ids)
        : { data: [], error: null };
      if (workspaceError) throw workspaceError;
      const names = new Map((workspaces || []).map(item => [item.id, item]));
      return response.status(200).json({
        activeWorkspaceId: profile?.workspace_id || ids[0] || null,
        workspaces: (memberships || []).map(item => ({ ...names.get(item.workspace_id), id: item.workspace_id, role: item.role })),
      });
    }

    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
    if (request.method === 'POST') {
      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
      if (!name) return response.status(400).json({ error: 'Informe o nome do novo workspace.' });
      const { data: workspace, error } = await admin.from('workspaces').insert({ name }).select('id,name').single();
      if (error) throw error;
      const { error: membershipError } = await admin.from('workspace_members').insert({ workspace_id: workspace.id, user_id: user.id, role: 'admin' });
      if (membershipError) throw membershipError;
      await admin.from('profiles').update({ workspace_id: workspace.id, company_name: name, role: 'admin', updated_at: new Date().toISOString() }).eq('id', user.id);
      return response.status(201).json({ workspace: { ...workspace, role: 'admin' } });
    }

    if (request.method === 'PATCH') {
      const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : '';
      const { data: membership } = await admin.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).maybeSingle();
      if (!membership) return response.status(403).json({ error: 'Você não pertence a esse workspace.' });
      const { data: workspace } = await admin.from('workspaces').select('name').eq('id', workspaceId).single();
      const { error } = await admin.from('profiles').update({ workspace_id: workspaceId, company_name: workspace.name, role: membership.role, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) throw error;
      return response.status(200).json({ selected: true });
    }

    response.setHeader('Allow', 'GET, POST, PATCH');
    return response.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    console.error('/api/workspaces failed', error);
    return response.status(500).json({ error: 'Não foi possível gerenciar seus workspaces.' });
  }
}
