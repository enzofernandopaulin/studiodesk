import { supabase } from './supabase';
import {
  UserProfile, Lead, Client, Project, Task, KanbanColumn, TimelineEvent,
  Message, Communication, CalendarEvent, ApprovalRequest, TeamMember,
  IntegrationItem, ApprovalComment
} from '../types';
import type { RealtimeTable } from './realtimeRepository';

export interface WorkspaceState {
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  kanbanColumns: KanbanColumn[];
  timelineEvents: TimelineEvent[];
  messages: Message[];
  communications: Communication[];
  calendarEvents: CalendarEvent[];
  approvalRequests: ApprovalRequest[];
  team: TeamMember[];
  integrations: IntegrationItem[];
}

type Row = Record<string, any>;

// Projeções explícitas reduzem tráfego e impedem que novas colunas sensíveis
// sejam enviadas ao navegador por acidente.
const LEAD_COLUMNS = 'id,name,company,email,phone,whatsapp,source,service_interest,assigned_to,notes,status,created_at,value';
const CLIENT_COLUMNS = 'id,name,company,email,phone,whatsapp,website,position,segment,assigned_to,status,notes,tags,created_at,lead_origin_id';
const COLUMN_COLUMNS = 'id,title,color,sort_order';
const PROJECT_COLUMNS = 'id,title,client_id,description,assigned_to,assigned_avatar,start_date,deadline,priority,status,column_id,tags,budget,progress,created_at';
const DELIVERABLE_COLUMNS = 'id,project_id,title,version,file_url,file_type,submitted_at,status,feedback_notes,reviewed_at,reviewed_by';
const MEDIA_COLUMNS = 'id,project_id,title,version,video_url,thumbnail_url,status';
const COMMENT_COLUMNS = 'id,media_approval_id,author,comment_role,author_role,timestamp_value,timecode,text_value,content,resolved';
const TASK_COLUMNS = 'id,title,project_id,client_id,assigned_to,assigned_avatar,deadline,priority,description,completed,completed_at,created_at';
const CALENDAR_COLUMNS = 'id,title,description,date_value,start_time,end_time,client_id,assigned_to,assigned_avatar,type,status,notes,location_or_link,created_at';
const APPROVAL_COLUMNS = 'id,title,description,client_id,project_id,assigned_to,assigned_avatar,category,created_at,due_date,status,priority,file_url,file_type,feedback_notes,rejection_reason,revision_notes,reviewed_by,reviewed_at';
const MESSAGE_COLUMNS = 'id,sender,sender_name,content,timestamp_value,client_id,project_id,task_id,media_type,media_url';
const COMMUNICATION_COLUMNS = 'id,client_id,project_id,channel,sender,content,status,timestamp_value';
const TIMELINE_COLUMNS = 'id,timestamp_value,time_string,actor,actor_avatar,action,details,category,reference_id';
const INTEGRATION_COLUMNS = 'id,name,category,description,status,connected_at,icon_name,details';

const parseDate = (value: unknown) => value == null ? undefined : String(value);
const clean = <T>(value: T | null | undefined): T | undefined => value == null ? undefined : value;

function mapLead(r: Row): Lead {
  return { id:r.id,name:r.name,company:r.company,email:r.email,phone:r.phone,whatsapp:r.whatsapp,source:r.source,serviceInterest:r.service_interest,assignedTo:r.assigned_to,notes:r.notes,status:r.status,createdAt:r.created_at,value:r.value == null ? undefined : Number(r.value) };
}
function mapClient(r: Row): Client {
  return { id:r.id,name:r.name,company:r.company,email:r.email,phone:r.phone,whatsapp:r.whatsapp,website:clean(r.website),position:clean(r.position),segment:r.segment,assignedTo:r.assigned_to,status:r.status,notes:clean(r.notes),tags:r.tags ?? [],createdAt:r.created_at,leadOriginId:clean(r.lead_origin_id) };
}
function mapProject(r: Row, deliverables: Row[], media: Row | undefined, comments: Row[]): Project {
  const projectDeliverables = deliverables.filter(d => d.project_id === r.id).map(d => ({
    id:d.id,title:d.title,version:d.version,fileUrl:clean(d.file_url),fileType:d.file_type,submittedAt:d.submitted_at,
    status:d.status,feedbackNotes:clean(d.feedback_notes),reviewedAt:clean(d.reviewed_at),reviewedBy:clean(d.reviewed_by)
  }));
  const mediaApproval = media ? {
    id:media.id,title:media.title,version:media.version,videoUrl:clean(media.video_url),thumbnailUrl:clean(media.thumbnail_url),
    status:media.status,comments:comments.filter(c => c.media_approval_id === media.id).map(mapComment)
  } : undefined;
  return {
    id:r.id,title:r.title,clientId:r.client_id,clientName:'',description:r.description,assignedTo:r.assigned_to,
    assignedAvatar:clean(r.assigned_avatar),startDate:parseDate(r.start_date) as string,deadline:parseDate(r.deadline) as string,
    priority:r.priority,status:r.status,columnId:r.column_id,tags:r.tags ?? [],budget:r.budget == null ? undefined : Number(r.budget),
    progress:r.progress,deliverables:projectDeliverables,mediaApproval,createdAt:r.created_at
  };
}
function mapComment(r: Row): ApprovalComment {
  return { id:r.id,author:r.author,role:clean(r.comment_role),authorRole:clean(r.author_role),timestamp:r.timestamp_value,timecode:clean(r.timecode),text:clean(r.text_value),content:clean(r.content),resolved:r.resolved };
}

export async function getWorkspaceId(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('workspace_id').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data?.workspace_id ?? null;
}

export async function loadWorkspace(workspaceId: string): Promise<WorkspaceState | null> {
  if (!supabase) return null;
  if (!workspaceId) return null;

  // Núcleo necessário ao dashboard e à navegação principal. Módulos menos
  // frequentes são carregados sob demanda pelo AppContext.
  const [leads, clients, columns, projects, deliverables, media, comments, tasks, timeline] = await Promise.all([
    supabase.from('leads').select(LEAD_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id').limit(100),
    supabase.from('clients').select(CLIENT_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id').limit(100),
    supabase.from('kanban_columns').select(COLUMN_COLUMNS).eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('projects').select(PROJECT_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id').limit(100),
    supabase.from('project_deliverables').select(DELIVERABLE_COLUMNS).eq('workspace_id', workspaceId),
    supabase.from('media_approvals').select(MEDIA_COLUMNS).eq('workspace_id', workspaceId),
    supabase.from('approval_comments').select(COMMENT_COLUMNS).eq('workspace_id', workspaceId),
    supabase.from('tasks').select(TASK_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id').limit(100),
    supabase.from('timeline_events').select(TIMELINE_COLUMNS).eq('workspace_id', workspaceId).order('timestamp_value', { ascending:false }).order('id').limit(20),
  ]);

  const result = [leads, clients, columns, projects, deliverables, media, comments, tasks, timeline];
  const failed = result.find(r => r.error);
  if (failed?.error) throw failed.error;

  const projectRows = projects.data ?? [];
  const clientNames = new Map((clients.data ?? []).map(c => [c.id, c.company || c.name]));
  const mediaByProject = new Map((media.data ?? []).map(m => [m.project_id, m]));
  const commentsRows = comments.data ?? [];

  return {
    leads: (leads.data ?? []).map(mapLead),
    clients: (clients.data ?? []).map(mapClient),
    kanbanColumns: (columns.data ?? []).map(c => ({ id:c.id,title:c.title,color:c.color,order:c.sort_order })),
    projects: projectRows.map(r => ({ ...mapProject(r, deliverables.data ?? [], mediaByProject.get(r.id), commentsRows), clientName:clientNames.get(r.client_id) ?? '' })),
    tasks: (tasks.data ?? []).map(r => ({ id:r.id,title:r.title,projectId:clean(r.project_id),projectTitle:'',clientId:clean(r.client_id),clientName:clientNames.get(r.client_id) ?? undefined,assignedTo:r.assigned_to,assignedAvatar:clean(r.assigned_avatar),deadline:r.deadline,priority:r.priority,description:clean(r.description),completed:r.completed,completedAt:clean(r.completed_at),createdAt:r.created_at })),
    calendarEvents: [],
    approvalRequests: [],
    messages: [],
    communications: [],
    timelineEvents: (timeline.data ?? []).map(r => ({ id:r.id,timestamp:r.timestamp_value,timeString:r.time_string,actor:r.actor,actorAvatar:clean(r.actor_avatar),action:r.action,details:clean(r.details),category:r.category,referenceId:clean(r.reference_id) })),
    // A fonte canônica da equipe é workspace_members, carregada pela API autenticada.
    team: [],
    integrations: [],
  };
}

/**
 * Recarrega apenas os grupos afetados por eventos Realtime. Relações derivadas
 * (por exemplo, nome do cliente dentro de projetos) entram como dependências.
 */
export async function loadWorkspacePatch(
  workspaceId: string,
  changedTables: RealtimeTable[],
  range?: { from: number; to: number },
): Promise<Partial<WorkspaceState>> {
  if (!supabase || !workspaceId || changedTables.length === 0) return {};

  const requested = new Set<string>(changedTables);
  const projectAggregateChanged = changedTables.some(table =>
    ['projects', 'project_deliverables', 'media_approvals', 'approval_comments'].includes(table),
  );
  const clientsChanged = requested.has('clients') && !range;
  const needClients = clientsChanged || projectAggregateChanged || requested.has('tasks') ||
    requested.has('calendar_events') || requested.has('approval_requests');
  const needProjects = projectAggregateChanged || clientsChanged || requested.has('approval_requests');
  const needProjectAggregate = projectAggregateChanged || clientsChanged;
  const needTasks = requested.has('tasks') || clientsChanged;
  const needCalendar = requested.has('calendar_events') || clientsChanged;
  const needApprovals = requested.has('approval_requests') || projectAggregateChanged || clientsChanged;
  const paginatedTables = new Set(['leads','clients','projects','tasks','calendar_events','approval_requests','messages','communications','timeline_events','integrations']);
  const paginate = (table: string, query: any) => range && requested.has(table) && paginatedTables.has(table)
    ? query.range(range.from, range.to)
    : query;

  const queries: Record<string, PromiseLike<{ data: any[] | null; error: any }>> = {};
  if (requested.has('leads')) queries.leads = paginate('leads', supabase.from('leads').select(LEAD_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id'));
  if (needClients) queries.clients = paginate('clients', supabase.from('clients').select(CLIENT_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id'));
  if (requested.has('kanban_columns')) queries.columns = paginate('kanban_columns', supabase.from('kanban_columns').select(COLUMN_COLUMNS).eq('workspace_id', workspaceId).order('sort_order'));
  if (needProjects) queries.projects = paginate('projects', supabase.from('projects').select(PROJECT_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id'));
  if (needProjectAggregate) {
    queries.deliverables = paginate('project_deliverables', supabase.from('project_deliverables').select(DELIVERABLE_COLUMNS).eq('workspace_id', workspaceId));
    queries.media = paginate('media_approvals', supabase.from('media_approvals').select(MEDIA_COLUMNS).eq('workspace_id', workspaceId));
    queries.comments = paginate('approval_comments', supabase.from('approval_comments').select(COMMENT_COLUMNS).eq('workspace_id', workspaceId));
  }
  if (needTasks) queries.tasks = paginate('tasks', supabase.from('tasks').select(TASK_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id'));
  if (needCalendar) queries.calendar = paginate('calendar_events', supabase.from('calendar_events').select(CALENDAR_COLUMNS).eq('workspace_id', workspaceId).order('date_value').order('id'));
  if (needApprovals) queries.approvals = paginate('approval_requests', supabase.from('approval_requests').select(APPROVAL_COLUMNS).eq('workspace_id', workspaceId).order('created_at', { ascending:false }).order('id'));
  if (requested.has('messages')) queries.messages = paginate('messages', supabase.from('messages').select(MESSAGE_COLUMNS).eq('workspace_id', workspaceId).order('timestamp_value').order('id'));
  if (requested.has('communications')) queries.communications = paginate('communications', supabase.from('communications').select(COMMUNICATION_COLUMNS).eq('workspace_id', workspaceId).order('timestamp_value').order('id'));
  if (requested.has('timeline_events')) queries.timeline = paginate('timeline_events', supabase.from('timeline_events').select(TIMELINE_COLUMNS).eq('workspace_id', workspaceId).order('timestamp_value', { ascending:false }).order('id'));
  if (requested.has('integrations')) queries.integrations = paginate('integrations', supabase.from('integrations').select(INTEGRATION_COLUMNS).eq('workspace_id', workspaceId));

  const entries = await Promise.all(Object.entries(queries).map(async ([key, query]) => [key, await query] as const));
  const results = Object.fromEntries(entries) as Record<string, { data: Row[] | null; error: any }>;
  const failed = entries.find(([, result]) => result.error);
  if (failed?.[1].error) throw failed[1].error;

  const patch: Partial<WorkspaceState> = {};
  const clientRows = results.clients?.data ?? [];
  const projectRows = results.projects?.data ?? [];
  const clientNames = new Map(clientRows.map(c => [c.id, c.company || c.name]));

  if (results.leads) patch.leads = (results.leads.data ?? []).map(mapLead);
  if (results.clients) patch.clients = clientRows.map(mapClient);
  if (results.columns) patch.kanbanColumns = (results.columns.data ?? []).map(c => ({ id:c.id,title:c.title,color:c.color,order:c.sort_order }));
  if (needProjectAggregate && results.projects) {
    const mediaByProject = new Map((results.media?.data ?? []).map(m => [m.project_id, m]));
    patch.projects = projectRows.map(r => ({
      ...mapProject(r, results.deliverables?.data ?? [], mediaByProject.get(r.id), results.comments?.data ?? []),
      clientName: clientNames.get(r.client_id) ?? '',
    }));
  }
  if (results.tasks) patch.tasks = (results.tasks.data ?? []).map(r => ({ id:r.id,title:r.title,projectId:clean(r.project_id),projectTitle:'',clientId:clean(r.client_id),clientName:clientNames.get(r.client_id) ?? undefined,assignedTo:r.assigned_to,assignedAvatar:clean(r.assigned_avatar),deadline:r.deadline,priority:r.priority,description:clean(r.description),completed:r.completed,completedAt:clean(r.completed_at),createdAt:r.created_at }));
  if (results.calendar) patch.calendarEvents = (results.calendar.data ?? []).map(r => ({ id:r.id,title:r.title,description:clean(r.description),date:r.date_value,startTime:String(r.start_time).slice(0,5),endTime:String(r.end_time).slice(0,5),clientId:clean(r.client_id),clientName:clientNames.get(r.client_id),assignedTo:r.assigned_to,assignedAvatar:clean(r.assigned_avatar),type:r.type,status:r.status,notes:clean(r.notes),locationOrLink:clean(r.location_or_link),createdAt:r.created_at }));
  if (results.approvals) patch.approvalRequests = (results.approvals.data ?? []).map(r => ({ id:r.id,title:r.title,description:r.description,clientId:r.client_id,clientName:clientNames.get(r.client_id) ?? '',projectId:clean(r.project_id),projectTitle:projectRows.find(p => p.id === r.project_id)?.title,assignedTo:r.assigned_to,assignedAvatar:clean(r.assigned_avatar),category:r.category,createdAt:r.created_at,dueDate:r.due_date,status:r.status,priority:r.priority,fileUrl:clean(r.file_url),fileType:clean(r.file_type),feedbackNotes:clean(r.feedback_notes),rejectionReason:clean(r.rejection_reason),revisionNotes:clean(r.revision_notes),reviewedBy:clean(r.reviewed_by),reviewedAt:clean(r.reviewed_at) }));
  if (results.messages) patch.messages = (results.messages.data ?? []).map(r => ({ id:r.id,sender:r.sender,senderName:r.sender_name,content:r.content,timestamp:r.timestamp_value,clientId:r.client_id,projectId:clean(r.project_id),taskId:clean(r.task_id),mediaType:r.media_type,mediaUrl:clean(r.media_url) }));
  if (results.communications) patch.communications = (results.communications.data ?? []).map(r => ({ id:r.id,clientId:r.client_id,projectId:clean(r.project_id),channel:r.channel,sender:r.sender,content:r.content,status:r.status,timestamp:r.timestamp_value }));
  if (results.timeline) patch.timelineEvents = (results.timeline.data ?? []).map(r => ({ id:r.id,timestamp:r.timestamp_value,timeString:r.time_string,actor:r.actor,actorAvatar:clean(r.actor_avatar),action:r.action,details:clean(r.details),category:r.category,referenceId:clean(r.reference_id) }));
  if (results.integrations) patch.integrations = (results.integrations.data ?? []).map(r => ({ id:r.id,name:r.name,category:r.category,description:r.description,status:r.status,connectedAt:clean(r.connected_at),iconName:r.icon_name,details:clean(r.details) }));
  return patch;
}

export async function completeOnboarding(user: UserProfile, columns: KanbanColumn[]): Promise<void> {
  if (!supabase) throw new Error('Supabase não está configurado.');
  if (!user.id) throw new Error('Usuário autenticado não encontrado.');
  const { error } = await supabase.rpc('complete_studiodesk_onboarding', {
    p_name: user.name,
    p_avatar: user.avatar,
    p_plan: user.plan,
    p_business_type: user.businessType,
    p_team_size: user.teamSize,
    p_objectives: user.objectives,
    p_template: user.template,
    p_columns: columns.map(column => ({
      id: column.id,
      title: column.title,
      color: column.color,
      order: column.order,
    })),
  });
  if (error) throw error;
}

export async function loadProfile(userId: string): Promise<Partial<UserProfile> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('name,email,avatar,role,plan,business_type,team_size,objectives,template,company_name').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id:userId,name:data.name,email:data.email,avatar:data.avatar,role:data.role,plan:data.plan,businessType:data.business_type,teamSize:data.team_size,objectives:data.objectives ?? [],template:data.template,companyName:data.company_name };
}

export async function saveProfile(user: UserProfile): Promise<void> {
  if (!supabase) return;
  if (!user.id) throw new Error('Perfil autenticado não encontrado.');
  // O bootstrap cria o perfil. O navegador pode apenas atualizar o próprio
  // registro; usar upsert exigiria permissão de INSERT e seria bloqueado pelo RLS.
  const { data, error } = await supabase.from('profiles').update({
    name:user.name,
    avatar:user.avatar,
    plan:user.plan,
    business_type:user.businessType,
    team_size:user.teamSize,
    objectives:user.objectives,
    template:user.template,
    company_name:user.companyName,
    updated_at:new Date().toISOString()
  }).eq('id', user.id).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('O perfil não foi encontrado no Supabase. Atualize a página e tente novamente.');
}
