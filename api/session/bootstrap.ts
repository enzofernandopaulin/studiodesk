import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { sendWebResponse, toWebRequest } from '../_lib/http.js';
import { rateLimit, requireAllowedOrigin } from '../_lib/security.js';

const normalizePlan = (value: unknown): string => {
  if (value === 'individual') return 'solo';
  return value === 'solo' || value === 'studio' || value === 'empresa' || value === 'agencia'
    ? value
    : 'solo';
};
const isKnownPlan = (value: unknown): boolean =>
  value === 'individual' || value === 'solo' || value === 'studio' || value === 'empresa' || value === 'agencia';

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

    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('id,workspace_id,plan,name,email,company_name,role,business_type').eq('id', auth.user.id).maybeSingle();
    if (profileError) throw profileError;

    const { data: memberships, error: membershipsError } = await admin.from('workspace_members')
      .select('workspace_id,role,created_at').eq('user_id', auth.user.id).order('created_at').limit(1);
    if (membershipsError) throw membershipsError;

    let membership = (memberships || [])[0] || null;
    if (!membership) {
      const workspaceName = String(auth.user.user_metadata?.company_name || 'Meu Workspace').trim().slice(0, 120) || 'Meu Workspace';
      const fallbackPlan = normalizePlan(profile?.plan || auth.user.user_metadata?.plan);
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
      .select('name,plan,owner_id').eq('id', active.workspace_id).single();
    if (workspaceError) throw workspaceError;

    if (!profile) {
      const { error: insertError } = await admin.from('profiles').insert({
        id: auth.user.id,
        workspace_id: active.workspace_id,
        name: String(auth.user.user_metadata?.name || auth.user.email?.split('@')[0] || ''),
        email: auth.user.email || '',
        company_name: workspace.name,
        role: active.role,
        plan: normalizePlan(auth.user.user_metadata?.plan),
      });
      if (insertError) throw insertError;
    } else if (profile.workspace_id !== active.workspace_id || profile.company_name !== workspace.name || profile.role !== active.role) {
      const { error: updateError } = await admin.from('profiles').update({
        workspace_id: active.workspace_id,
        company_name: workspace.name,
        role: active.role,
        updated_at: new Date().toISOString(),
      }).eq('id', auth.user.id);
      if (updateError) throw updateError;
    }

    // Durante o primeiro acesso, a escolha feita na landing/cadastro prevalece
    // sobre o valor padrão legado. Depois do onboarding, o workspace é canônico.
    const metadataPlan = auth.user.user_metadata?.plan;
    const selectedPlan = normalizePlan(metadataPlan);
    const isFirstAccess = !profile?.business_type;
    if (isFirstAccess && isKnownPlan(metadataPlan) && workspace.owner_id === auth.user.id && workspace.plan !== selectedPlan) {
      const { error: workspacePlanError } = await admin.from('workspaces')
        .update({ plan: selectedPlan, updated_at: new Date().toISOString() }).eq('id', active.workspace_id);
      if (workspacePlanError) throw workspacePlanError;
      const { error: profilePlanError } = await admin.from('profiles')
        .update({ plan: selectedPlan, updated_at: new Date().toISOString() }).eq('id', auth.user.id);
      if (profilePlanError) throw profilePlanError;
    }

    return response.status(200).json({ ready: true, workspaceId: active.workspace_id });
  } catch (error) {
    console.error('POST /api/session/bootstrap failed', error);
    const message = error instanceof Error ? error.message : '';
    if (/relation .* does not exist|schema cache/i.test(message)) {
      return response.status(503).json({ error: 'O banco do Supabase está incompleto. Execute os arquivos SQL de configuração.' });
    }
    return response.status(500).json({ error: 'Não foi possível preparar o perfil e o workspace desta conta.' });
  }
}
