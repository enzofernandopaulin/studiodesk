import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, toWebRequest } from '../_lib/http.js';
import { getPortalScope } from '../_lib/portalAuth.js';

async function loadData(request: Request) {
  const admin = getAdminClient();
  const scope = await getPortalScope(request, admin);
  if (!scope) return json({ error: 'Sessão do Portal inválida ou expirada.' }, 401);
  const [projectResult, columnsResult, tasksResult, approvalsResult, mediaResult] = await Promise.all([
    admin.from('projects').select('id,title,description,status,column_id,progress,created_at').eq('workspace_id', scope.workspaceId).eq('id', scope.projectId).eq('client_id', scope.clientId).single(),
    admin.from('kanban_columns').select('id,title,color,sort_order').eq('workspace_id', scope.workspaceId).order('sort_order'),
    admin.from('tasks').select('id,title,project_id,deadline,priority,description,completed,completed_at,created_at').eq('workspace_id', scope.workspaceId).eq('project_id', scope.projectId).order('created_at', { ascending: true }).limit(500),
    admin.from('approval_requests').select('id,title,description,project_id,category,created_at,due_date,status,priority,file_url,file_type,feedback_notes,rejection_reason,revision_notes,reviewed_at').eq('workspace_id', scope.workspaceId).eq('project_id', scope.projectId).eq('client_id', scope.clientId).order('created_at', { ascending: false }).limit(100),
    admin.from('media_approvals').select('id,title,version,video_url,thumbnail_url,status').eq('workspace_id', scope.workspaceId).eq('project_id', scope.projectId).order('version', { ascending: false }).limit(100),
  ]);
  if (projectResult.error || columnsResult.error || tasksResult.error || approvalsResult.error || mediaResult.error) throw projectResult.error || columnsResult.error || tasksResult.error || approvalsResult.error || mediaResult.error;
  const approvalIds = (approvalsResult.data || []).map(row => row.id);
  const mediaIds = (mediaResult.data || []).map(row => row.id);
  const commentsQueries = [];
  if (approvalIds.length) commentsQueries.push(admin.from('approval_comments').select('id,approval_request_id,media_approval_id,author,author_role,comment_role,timestamp_value,timecode,text_value,content,resolved').eq('workspace_id', scope.workspaceId).in('approval_request_id', approvalIds).order('timestamp_value', { ascending: true }).limit(500));
  if (mediaIds.length) commentsQueries.push(admin.from('approval_comments').select('id,approval_request_id,media_approval_id,author,author_role,comment_role,timestamp_value,timecode,text_value,content,resolved').eq('workspace_id', scope.workspaceId).in('media_approval_id', mediaIds).order('timestamp_value', { ascending: true }).limit(500));
  const commentResults = await Promise.all(commentsQueries);
  if (commentResults.some(result => result.error)) throw commentResults.find(result => result.error)?.error;
  const comments = commentResults.flatMap(result => result.data || []);
  return json({
    scope: { projectId: scope.projectId, clientId: scope.clientId, clientName: scope.clientName, clientCompany: scope.clientCompany },
    project: projectResult.data,
    columns: (columnsResult.data || []).filter(column => column.id === projectResult.data.column_id),
    tasks: tasksResult.data || [],
    approvals: (approvalsResult.data || []).map(({ file_url, ...approval }) => ({ ...approval, has_file: Boolean(file_url) })),
    mediaApprovals: (mediaResult.data || []).map(({ video_url, thumbnail_url, ...media }) => ({ ...media, has_video: Boolean(video_url), has_thumbnail: Boolean(thumbnail_url) })),
    comments,
  });
}
export default async function handler(request: any, response: any) {
  const webRequest = toWebRequest(request);
  if (request.method !== 'GET') return sendWebResponse(methodNotAllowed(['GET']), response);
  try { return sendWebResponse(await loadData(webRequest), response); }
  catch (error) { console.error('GET /api/portal/session failed', error); return sendWebResponse(json({ error: 'Não foi possível carregar os dados autorizados do Portal.' }, 500), response); }
}
