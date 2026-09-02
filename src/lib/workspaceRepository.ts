import { supabase } from './supabase';
import {
  UserProfile, Lead, Client, Project, Task, KanbanColumn, TimelineEvent,
  Message, Communication, CalendarEvent, ApprovalRequest, TeamMember,
  IntegrationItem, ApprovalComment
} from '../types';

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

export async function loadWorkspace(userId: string): Promise<Partial<WorkspaceState> | null> {
  if (!supabase) return null;
  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId) return null;

  const [leads, clients, columns, projects, deliverables, media, comments, tasks, calendar, approvals, messages, communications, timeline, team, integrations] = await Promise.all([
    supabase.from('leads').select('*').eq('workspace_id', workspaceId),
    supabase.from('clients').select('*').eq('workspace_id', workspaceId),
    supabase.from('kanban_columns').select('*').eq('workspace_id', workspaceId).order('sort_order'),
    supabase.from('projects').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending:false }),
    supabase.from('project_deliverables').select('*').eq('workspace_id', workspaceId),
    supabase.from('media_approvals').select('*').eq('workspace_id', workspaceId),
    supabase.from('approval_comments').select('*').eq('workspace_id', workspaceId),
    supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending:false }),
    supabase.from('calendar_events').select('*').eq('workspace_id', workspaceId).order('date_value'),
    supabase.from('approval_requests').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending:false }),
    supabase.from('messages').select('*').eq('workspace_id', workspaceId).order('timestamp_value'),
    supabase.from('communications').select('*').eq('workspace_id', workspaceId).order('timestamp_value'),
    supabase.from('timeline_events').select('*').eq('workspace_id', workspaceId).order('timestamp_value', { ascending:false }),
    supabase.from('team_members').select('*').eq('workspace_id', workspaceId),
    supabase.from('integrations').select('*').eq('workspace_id', workspaceId),
  ]);

  const result = [leads, clients, columns, projects, deliverables, media, comments, tasks, calendar, approvals, messages, communications, timeline, team, integrations];
  const failed = result.find(r => r.error);
  if (failed?.error) throw failed.error;

  const hasData = result.some(r => (r.data ?? []).length > 0);
  if (!hasData) return null;

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
    calendarEvents: (calendar.data ?? []).map(r => ({ id:r.id,title:r.title,description:clean(r.description),date:r.date_value,startTime:String(r.start_time).slice(0,5),endTime:String(r.end_time).slice(0,5),clientId:clean(r.client_id),clientName:clientNames.get(r.client_id),assignedTo:r.assigned_to,assignedAvatar:clean(r.assigned_avatar),type:r.type,status:r.status,notes:clean(r.notes),locationOrLink:clean(r.location_or_link),createdAt:r.created_at })),
    approvalRequests: (approvals.data ?? []).map(r => ({ id:r.id,title:r.title,description:r.description,clientId:r.client_id,clientName:clientNames.get(r.client_id) ?? '',projectId:clean(r.project_id),projectTitle:projectRows.find(p => p.id === r.project_id)?.title,assignedTo:r.assigned_to,assignedAvatar:clean(r.assigned_avatar),category:r.category,createdAt:r.created_at,dueDate:r.due_date,status:r.status,priority:r.priority,fileUrl:clean(r.file_url),fileType:clean(r.file_type),feedbackNotes:clean(r.feedback_notes),rejectionReason:clean(r.rejection_reason),revisionNotes:clean(r.revision_notes),reviewedBy:clean(r.reviewed_by),reviewedAt:clean(r.reviewed_at) })),
    messages: (messages.data ?? []).map(r => ({ id:r.id,sender:r.sender,senderName:r.sender_name,content:r.content,timestamp:r.timestamp_value,clientId:r.client_id,projectId:clean(r.project_id),taskId:clean(r.task_id),mediaType:r.media_type,mediaUrl:clean(r.media_url) })),
    communications: (communications.data ?? []).map(r => ({ id:r.id,clientId:r.client_id,projectId:clean(r.project_id),channel:r.channel,sender:r.sender,content:r.content,status:r.status,timestamp:r.timestamp_value })),
    timelineEvents: (timeline.data ?? []).map(r => ({ id:r.id,timestamp:r.timestamp_value,timeString:r.time_string,actor:r.actor,actorAvatar:clean(r.actor_avatar),action:r.action,details:clean(r.details),category:r.category,referenceId:clean(r.reference_id) })),
    team: (team.data ?? []).map(r => ({ id:r.id,name:r.name,email:r.email,role:r.role,accessLevel:r.access_level,avatar:r.avatar,projectsCount:r.projects_count,status:r.status })),
    integrations: (integrations.data ?? []).map(r => ({ id:r.id,name:r.name,category:r.category,description:r.description,status:r.status,connectedAt:clean(r.connected_at),iconName:r.icon_name,details:clean(r.details) })),
  };
}

export async function saveWorkspace(_userId: string, state: WorkspaceState): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('sync_workspace', { payload: state });
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
  const { error } = await supabase.from('profiles').upsert({ id:user.id,name:user.name,email:user.email,avatar:user.avatar,role:user.role,plan:user.plan,business_type:user.businessType,team_size:user.teamSize,objectives:user.objectives,template:user.template,company_name:user.companyName,updated_at:new Date().toISOString() }, { onConflict:'id' });
  if (error) throw error;
}

export async function ensureWorkspace(user: UserProfile, state: WorkspaceState): Promise<void> {
  if (!supabase) return;
  await saveProfile(user);
  const existing = await loadWorkspace(user.id);
  if (!existing) await saveWorkspace(user.id, state);
}
