import { authenticateRequest, getMembership } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../_lib/http.js';
import { rateLimit, readJson, requireAllowedOrigin } from '../_lib/security.js';

const VALID_PLANS = new Set(['individual', 'solo', 'studio', 'empresa', 'agencia']);
const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

type Body = {
  name?: unknown;
  avatar?: unknown;
  plan?: unknown;
  businessType?: unknown;
  teamSize?: unknown;
  objectives?: unknown;
  template?: unknown;
  columns?: unknown;
};

type Column = { id?: unknown; title?: unknown; color?: unknown; order?: unknown };

export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  const limited = rateLimit(webRequest, 10);
  if (limited) return sendWebResponse(limited, response);
  const originError = requireAllowedOrigin(webRequest);
  if (originError) return sendWebResponse(originError, response);
  if (request.method !== 'POST') return sendWebResponse(methodNotAllowed(['POST']), response);

  try {
    const { user, admin } = await authenticateRequest(webRequest);
    const body = await readJson<Body>(webRequest);
    const plan = text(body.plan, 20);
    const name = text(body.name, 160);
    const avatar = text(body.avatar, 2000);
    const businessType = text(body.businessType, 120);
    const teamSize = text(body.teamSize, 60);
    const template = text(body.template, 120);
    const objectives = Array.isArray(body.objectives)
      ? body.objectives.filter((item): item is string => typeof item === 'string').slice(0, 20).map(item => item.trim().slice(0, 120))
      : [];
    const rawColumns = Array.isArray(body.columns) ? body.columns as Column[] : [];

    if (!VALID_PLANS.has(plan)) return sendWebResponse(json({ error: 'Plano inválido.' }, 400), response);
    if (rawColumns.length < 1 || rawColumns.length > 20) {
      return sendWebResponse(json({ error: 'O modelo do Kanban precisa ter entre 1 e 20 colunas.' }, 400), response);
    }

    const columns = rawColumns.map((column, index) => ({
      id: text(column.id, 120),
      title: text(column.title, 160),
      color: text(column.color, 20) || '#66acd7',
      sort_order: typeof column.order === 'number' && Number.isInteger(column.order) ? column.order : index,
    }));
    if (columns.some(column => !column.id || !column.title)) {
      return sendWebResponse(json({ error: 'Coluna do Kanban inválida.' }, 400), response);
    }

    const membership = await getMembership(admin, user.id);
    if (!membership || !['admin', 'gestor'].includes(membership.role)) {
      return sendWebResponse(json({ error: 'Sem permissão para concluir a configuração.' }, 403), response);
    }

    const { data: workspace, error: workspaceReadError } = await admin
      .from('workspaces')
      .select('id,owner_id')
      .eq('id', membership.workspace_id)
      .single();
    if (workspaceReadError || !workspace) throw workspaceReadError || new Error('Workspace não encontrado.');
    if (workspace.owner_id !== user.id) {
      return sendWebResponse(json({ error: 'Somente o proprietário pode configurar o plano do workspace.' }, 403), response);
    }

    const now = new Date().toISOString();
    const { error: profileError } = await admin.from('profiles').update({
      name,
      avatar,
      plan,
      business_type: businessType,
      team_size: teamSize,
      objectives,
      template,
      updated_at: now,
    }).eq('id', user.id);
    if (profileError) throw profileError;

    const { error: workspaceError } = await admin.from('workspaces').update({
      plan,
      updated_at: now,
    }).eq('id', membership.workspace_id).eq('owner_id', user.id);
    if (workspaceError) throw workspaceError;

    const { error: deleteError } = await admin.from('kanban_columns').delete().eq('workspace_id', membership.workspace_id);
    if (deleteError) throw deleteError;
    const { error: columnsError } = await admin.from('kanban_columns').insert(
      columns.map(column => ({ ...column, workspace_id: membership.workspace_id })),
    );
    if (columnsError) throw columnsError;

    return sendWebResponse(json({ completed: true, plan, workspaceId: membership.workspace_id }), response);
  } catch (error) {
    console.error('POST /api/session/complete-onboarding failed', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Payload muito grande') || message.includes('Corpo da solicitação')) {
      return sendWebResponse(json({ error: message }, 413), response);
    }
    return sendWebResponse(json({ error: message || 'Não foi possível concluir a configuração.' }, 500), response);
  }
}
