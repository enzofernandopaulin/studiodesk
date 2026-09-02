import { supabase } from './supabase';
import { getWorkspaceId } from './workspaceRepository';
import {
  Lead, Client, Project, Task, KanbanColumn, TimelineEvent, Message,
  Communication, CalendarEvent, ApprovalRequest, TeamMember, IntegrationItem
} from '../types';

const workspaceCache = new Map<string, string>();

async function workspaceFor(userId: string): Promise<string | null> {
  const cached = workspaceCache.get(userId);
  if (cached) return cached;
  const id = await getWorkspaceId(userId);
  if (id) workspaceCache.set(userId, id);
  return id;
}

async function write<T>(userId: string, table: string, row: T) {
  if (!supabase) return;
  const workspaceId = await workspaceFor(userId);
  if (!workspaceId) throw new Error('Workspace não encontrado para o usuário autenticado.');
  const { error } = await supabase.from(table).upsert({ ...(row as object), workspace_id: workspaceId }, { onConflict: 'workspace_id,id' });
  if (error) throw error;
}

async function remove(userId: string, table: string, id: string) {
  if (!supabase) return;
  const workspaceId = await workspaceFor(userId);
  if (!workspaceId) throw new Error('Workspace não encontrado para o usuário autenticado.');
  const { error } = await supabase.from(table).delete().eq('workspace_id', workspaceId).eq('id', id);
  if (error) throw error;
}

function leadRow(v: Lead) {
  return { id:v.id,name:v.name,company:v.company,email:v.email,phone:v.phone,whatsapp:v.whatsapp,source:v.source,service_interest:v.serviceInterest,assigned_to:v.assignedTo,notes:v.notes,status:v.status,created_at:v.createdAt,value:v.value };
}
function clientRow(v: Client) {
  return { id:v.id,name:v.name,company:v.company,email:v.email,phone:v.phone,whatsapp:v.whatsapp,website:v.website,position:v.position,segment:v.segment,assigned_to:v.assignedTo,status:v.status,notes:v.notes,tags:v.tags,created_at:v.createdAt,lead_origin_id:v.leadOriginId };
}
function projectRow(v: Project) {
  return { id:v.id,title:v.title,client_id:v.clientId,description:v.description,assigned_to:v.assignedTo,assigned_avatar:v.assignedAvatar,start_date:v.startDate,deadline:v.deadline,priority:v.priority,status:v.status,column_id:v.columnId,tags:v.tags,budget:v.budget,progress:v.progress,created_at:v.createdAt };
}
function taskRow(v: Task) {
  return { id:v.id,title:v.title,project_id:v.projectId,client_id:v.clientId,assigned_to:v.assignedTo,assigned_avatar:v.assignedAvatar,deadline:v.deadline,priority:v.priority,description:v.description,completed:v.completed,completed_at:v.completedAt,created_at:v.createdAt };
}
function columnRow(v: KanbanColumn) { return { id:v.id,title:v.title,color:v.color,sort_order:v.order }; }
function timelineRow(v: TimelineEvent) { return { id:v.id,timestamp_value:v.timestamp,time_string:v.timeString,actor:v.actor,actor_avatar:v.actorAvatar,action:v.action,details:v.details,category:v.category,reference_id:v.referenceId }; }
function messageRow(v: Message) { return { id:v.id,sender:v.sender,sender_name:v.senderName,content:v.content,timestamp_value:v.timestamp,client_id:v.clientId,project_id:v.projectId,task_id:v.taskId,media_type:v.mediaType ?? 'text',media_url:v.mediaUrl }; }
function communicationRow(v: Communication) { return { id:v.id,client_id:v.clientId,project_id:v.projectId,channel:v.channel,sender:v.sender,content:v.content,status:v.status,timestamp_value:v.timestamp }; }
function calendarRow(v: CalendarEvent) { return { id:v.id,title:v.title,description:v.description,date_value:v.date,start_time:v.startTime,end_time:v.endTime,client_id:v.clientId,assigned_to:v.assignedTo,assigned_avatar:v.assignedAvatar,type:v.type,status:v.status,notes:v.notes,location_or_link:v.locationOrLink,created_at:v.createdAt }; }
function approvalRow(v: ApprovalRequest) { return { id:v.id,title:v.title,description:v.description,client_id:v.clientId,project_id:v.projectId,assigned_to:v.assignedTo,assigned_avatar:v.assignedAvatar,category:v.category,created_at:v.createdAt,due_date:v.dueDate,status:v.status,priority:v.priority,file_url:v.fileUrl,file_type:v.fileType,feedback_notes:v.feedbackNotes,rejection_reason:v.rejectionReason,revision_notes:v.revisionNotes,reviewed_by:v.reviewedBy,reviewed_at:v.reviewedAt }; }
function teamRow(v: TeamMember) { return { id:v.id,name:v.name,email:v.email,role:v.role,access_level:v.accessLevel,avatar:v.avatar,projects_count:v.projectsCount,status:v.status }; }
function integrationRow(v: IntegrationItem) { return { id:v.id,name:v.name,category:v.category,description:v.description,status:v.status,connected_at:v.connectedAt,icon_name:v.iconName,details:v.details }; }

export const entityRepository = {
  lead: { upsert:(u:string,v:Lead)=>write(u,'leads',leadRow(v)), delete:(u:string,id:string)=>remove(u,'leads',id) },
  client: { upsert:(u:string,v:Client)=>write(u,'clients',clientRow(v)), delete:(u:string,id:string)=>remove(u,'clients',id) },
  project: { upsert:(u:string,v:Project)=>write(u,'projects',projectRow(v)), delete:(u:string,id:string)=>remove(u,'projects',id) },
  task: { upsert:(u:string,v:Task)=>write(u,'tasks',taskRow(v)), delete:(u:string,id:string)=>remove(u,'tasks',id) },
  column: { upsert:(u:string,v:KanbanColumn)=>write(u,'kanban_columns',columnRow(v)), delete:(u:string,id:string)=>remove(u,'kanban_columns',id) },
  timeline: { upsert:(u:string,v:TimelineEvent)=>write(u,'timeline_events',timelineRow(v)) },
  message: { upsert:(u:string,v:Message)=>write(u,'messages',messageRow(v)) },
  communication: { upsert:(u:string,v:Communication)=>write(u,'communications',communicationRow(v)) },
  calendar: { upsert:(u:string,v:CalendarEvent)=>write(u,'calendar_events',calendarRow(v)), delete:(u:string,id:string)=>remove(u,'calendar_events',id) },
  approval: { upsert:(u:string,v:ApprovalRequest)=>write(u,'approval_requests',approvalRow(v)), delete:(u:string,id:string)=>remove(u,'approval_requests',id) },
  team: { upsert:(u:string,v:TeamMember)=>write(u,'team_members',teamRow(v)), delete:(u:string,id:string)=>remove(u,'team_members',id) },
  integration: { upsert:(u:string,v:IntegrationItem)=>write(u,'integrations',integrationRow(v)) },
};

export async function upsertProjectAggregate(userId: string, project: Project) {
  await entityRepository.project.upsert(userId, project);
  if (!supabase) return;
  const workspaceId = await workspaceFor(userId);
  if (!workspaceId) throw new Error('Workspace não encontrado.');

  const deliverables = project.deliverables ?? [];
  if (deliverables.length) {
    const { error } = await supabase.from('project_deliverables').upsert(
      deliverables.map(d => ({ id:d.id, workspace_id:workspaceId, project_id:project.id, title:d.title, version:d.version, file_url:d.fileUrl, file_type:d.fileType, submitted_at:d.submittedAt, status:d.status, feedback_notes:d.feedbackNotes, reviewed_at:d.reviewedAt, reviewed_by:d.reviewedBy })),
      { onConflict:'workspace_id,id' }
    );
    if (error) throw error;
  }
  if (project.mediaApproval) {
    const m = project.mediaApproval;
    const { error } = await supabase.from('media_approvals').upsert({ id:m.id,workspace_id:workspaceId,project_id:project.id,title:m.title,version:m.version,video_url:m.videoUrl,thumbnail_url:m.thumbnailUrl,status:m.status }, { onConflict:'workspace_id,id' });
    if (error) throw error;
    if (m.comments.length) {
      const { error: commentError } = await supabase.from('approval_comments').upsert(
        m.comments.map(c => ({ id:c.id,workspace_id:workspaceId,media_approval_id:m.id,author:c.author,author_role:c.authorRole,comment_role:c.role,timestamp_value:c.timestamp,timecode:c.timecode,text_value:c.text,content:c.content,resolved:c.resolved ?? false })),
        { onConflict:'workspace_id,id' }
      );
      if (commentError) throw commentError;
    }
  }
}


export async function updateMediaApprovalAsset(userId: string, projectId: string, asset: { id?: string; title?: string; version?: string; status?: string; videoUrl?: string; thumbnailUrl?: string }) {
  if (!supabase) return;
  const workspaceId = await workspaceFor(userId);
  if (!workspaceId) throw new Error('Workspace não encontrado.');
  const id = asset.id || 'med_' + projectId;
  const { error } = await supabase.from('media_approvals').upsert({
    id,
    workspace_id: workspaceId,
    project_id: projectId,
    title: asset.title || 'Aprovação de mídia',
    version: asset.version || 'V1',
    video_url: asset.videoUrl,
    thumbnail_url: asset.thumbnailUrl,
    status: asset.status || 'pendente'
  }, { onConflict: 'workspace_id,id' });
  if (error) throw error;
}

export async function clearWorkspaceCache(userId: string) { workspaceCache.delete(userId); }
