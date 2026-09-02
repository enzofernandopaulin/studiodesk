export type PlanType = 'solo' | 'studio' | 'empresa' | 'agencia' | 'individual';

export type UserRole = 'admin' | 'gestor' | 'colaborador';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  plan: PlanType;
  businessType: string;
  teamSize: string;
  objectives: string[];
  template: string;
  companyName: string;
}

export type LeadStatus = 'novo' | 'em_contato' | 'qualificado' | 'proposta' | 'convertido' | 'perdido';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  source: 'Site Institucional' | 'Instagram' | 'Indicação' | 'WhatsApp Direto' | 'Google' | 'Outro';
  serviceInterest: string;
  assignedTo: string;
  notes: string;
  status: LeadStatus;
  createdAt: string;
  value?: number;
}

export type ClientStatus = 'ativo' | 'inativo';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  website?: string;
  position?: string;
  segment: string;
  assignedTo: string;
  status: ClientStatus;
  notes?: string;
  tags: string[];
  createdAt: string;
  leadOriginId?: string;
}

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type PriorityLevel = Priority;
export type ProjectStatus = 'briefing' | 'roteiro' | 'producao' | 'edicao' | 'revisao' | 'aprovacao' | 'concluido';

export type CalendarEventType = 'meeting' | 'call' | 'follow_up' | 'presentation' | 'task' | 'deadline' | 'other';
export type CalendarEventStatus = 'scheduled' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  clientId?: string;
  clientName?: string;
  assignedTo: string;
  assignedAvatar?: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  notes?: string;
  locationOrLink?: string;
  createdAt: string;
}

export type ApprovalStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_revision';
export type ApprovalCategory = 'video' | 'roteiro' | 'design' | 'orcamento' | 'contrato' | 'outro';

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectTitle?: string;
  assignedTo: string;
  assignedAvatar?: string;
  category: ApprovalCategory;
  createdAt: string;
  dueDate: string;
  status: ApprovalStatus;
  priority: Priority;
  fileUrl?: string;
  fileType?: 'video' | 'image' | 'document' | 'other';
  feedbackNotes?: string;
  rejectionReason?: string;
  revisionNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ApprovalComment {
  id: string;
  author: string;
  role?: 'cliente' | 'equipe' | string;
  authorRole?: string;
  timestamp: string;
  timecode?: string;
  text?: string;
  content?: string;
  resolved?: boolean;
}

export interface MediaApproval {
  id: string;
  title: string;
  version: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'pendente' | 'aprovado' | 'ajustes_solicitados';
  comments: ApprovalComment[];
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  description: string;
  assignedTo: string;
  assignedAvatar?: string;
  startDate: string;
  deadline: string;
  priority: Priority;
  status: string; // Column ID in Kanban
  columnId: string;
  tags: string[];
  budget?: number;
  progress: number;
  deliverables?: ProjectDeliverable[];
  mediaApproval?: MediaApproval;
  createdAt: string;
}

export interface ProjectDeliverable {
  id: string;
  title: string;
  version: string;
  fileUrl?: string;
  fileType: 'video' | 'design' | 'doc' | 'audio';
  submittedAt: string;
  status: 'aguardando_aprovacao' | 'aprovado' | 'alteracoes_solicitadas';
  feedbackNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Task {
  id: string;
  title: string;
  projectId?: string;
  projectTitle?: string;
  clientId?: string;
  clientName?: string;
  assignedTo: string;
  assignedAvatar?: string;
  deadline: string;
  priority: Priority;
  description?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timeString: string;
  actor: string;
  actorAvatar?: string;
  action: string;
  details?: string;
  category: 'projeto' | 'cliente' | 'tarefa' | 'lead' | 'aprovacao' | 'comunicacao';
  referenceId?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'client' | string;
  senderName: string;
  content: string;
  timestamp: string;
  clientId: string;
  projectId?: string;
  taskId?: string;
  mediaType?: 'text' | 'audio' | 'video' | 'file';
  mediaUrl?: string;
}

export interface Communication {
  id: string;
  clientId: string;
  projectId?: string;
  channel: 'whatsapp' | 'email' | 'interno';
  sender: string;
  content: string;
  status: 'enviado' | 'entregue' | 'lido';
  timestamp: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string; // e.g. "Diretor Audiovisual", "Editor Chefe"
  accessLevel: UserRole;
  avatar: string;
  projectsCount: number;
  status: 'ativo' | 'convidado';
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'conectado' | 'configuravel' | 'preparado';
  connectedAt?: string;
  iconName: string;
  details?: string;
}

export type ActiveView = 
  | 'landing'
  | 'login'
  | 'auth'
  | 'profile_select'
  | 'onboarding'
  | 'first_access'
  | 'dashboard'
  | 'leads'
  | 'clients'
  | 'client_detail'
  | 'client_profile'
  | 'projects'
  | 'project_detail'
  | 'kanban'
  | 'tasks'
  | 'schedule'
  | 'calendar'
  | 'activities'
  | 'communication'
  | 'approval'
  | 'approvals'
  | 'metrics'
  | 'operational_metrics'
  | 'integrations'
  | 'team'
  | 'settings';
