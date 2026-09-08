import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ActiveView,
  UserProfile,
  PlanType,
  Lead,
  Client,
  Project,
  Task,
  KanbanColumn,
  TimelineEvent,
  Message,
  Communication,
  CalendarEvent,
  CalendarEventStatus,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalComment,
  TeamMember,
  IntegrationItem,
  Priority
} from '../types';
import { DEFAULT_KANBAN_COLUMNS } from '../data/defaults';
import { getPlanDetails } from '../data/plans';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadProfile, loadWorkspace } from '../lib/workspaceRepository';
import { convertLeadAtomic, entityRepository, upsertProjectAggregate, updateMediaApprovalAsset } from '../lib/entityRepository';
import { uploadWorkspaceFile } from '../lib/storageRepository';
import { can, Permission } from '../lib/permissions';
import { subscribeToWorkspaceRealtime, removeRealtimeChannel, RealtimeTable } from '../lib/realtimeRepository';
import { callServerApi } from '../lib/serverApi';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation & State
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  
  // User & Plan
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  setPlan: (plan: PlanType) => void;
  
  // Data lists
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  kanbanColumns: KanbanColumn[];
  setKanbanColumns: React.Dispatch<React.SetStateAction<KanbanColumn[]>>;
  timelineEvents: TimelineEvent[];
  messages: Message[];
  communications: Communication[];
  addCommunication: (comm: Omit<Communication, 'id' | 'timestamp'>) => Promise<void>;
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<CalendarEvent>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  toggleCalendarEventStatus: (id: string, status: CalendarEventStatus) => Promise<void>;
  approvalRequests: ApprovalRequest[];
  addApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'createdAt'>) => Promise<ApprovalRequest>;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => Promise<void>;
  deleteApprovalRequest: (id: string) => Promise<void>;
  updateApprovalStatus: (id: string, status: ApprovalStatus, notes?: string, reviewedBy?: string) => Promise<void>;
  updateProjectApproval: (projectId: string, status: 'pendente' | 'aprovado' | 'ajustes_solicitados', comments: ApprovalComment[]) => Promise<void>;
  uploadProjectMedia: (projectId: string, file: File, kind: 'video' | 'thumbnail') => Promise<void>;
  team: TeamMember[];
  integrations: IntegrationItem[];
  
  // Global search modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  convertLeadToClient: (leadId: string, createProject?: boolean, projectTitle?: string) => Promise<{ client: Client; project?: Project }>;
  
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  moveProjectToColumn: (projectId: string, targetColumnId: string) => Promise<void>;
  moveProjectColumn: (projectId: string, targetColumnId: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  submitProjectFeedback: (projectId: string, deliverableId: string, status: 'aprovado' | 'alteracoes_solicitadas', feedbackNotes: string) => Promise<void>;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  toggleTaskCompleted: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  addKanbanColumn: (title: string, color?: string) => Promise<void>;
  updateKanbanColumn: (id: string, title: string, color?: string) => Promise<void>;
  deleteKanbanColumn: (id: string) => Promise<void>;
  
  sendMessage: (clientId: string, content: string, projectId?: string, mediaType?: 'text' | 'audio' | 'video' | 'file') => Promise<void>;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'projectsCount' | 'status'>) => Promise<void>;
  removeTeamMember: (id: string) => Promise<boolean>;
  refreshTeam: () => Promise<void>;
  toggleIntegration: (id: string) => Promise<void>;
  
  // Authentication / persistence
  isSupabaseConfigured: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  workspaceStatus: 'idle' | 'loading' | 'ready' | 'empty' | 'error';
  workspaceError: string;
  retryWorkspaceLoad: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string, companyName: string) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
  role: UserProfile['role'];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const EMPTY_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  role: 'admin',
  plan: 'individual',
  businessType: '',
  teamSize: '',
  objectives: [],
  template: '',
  companyName: '',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ActiveView>('landing');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persistent States
  // The first migration keeps the existing domain model intact and moves persistence
  // to Supabase JSONB. Later phases can normalize individual entities without
  // forcing a rewrite of every screen at once.
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const authDestinationRef = useRef<ActiveView | null>(null);
  const loadedUserRef = useRef<string | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [isHydrated, setIsHydrated] = useState(!isSupabaseConfigured);
  const [workspaceStatus, setWorkspaceStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [workspaceError, setWorkspaceError] = useState('');

  const [user, setUserState] = useState<UserProfile>(EMPTY_USER);
  const setUser: React.Dispatch<React.SetStateAction<UserProfile>> = (update) => {
    setUserState(prev => {
      const candidate = typeof update === 'function' ? (update as (p: UserProfile) => UserProfile)(prev) : update;
      // role, id and email are identity fields controlled by Auth/membership, not by UI forms.
      return { ...candidate, id: prev.id, email: prev.email, role: prev.role };
    });
  };
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(DEFAULT_KANBAN_COLUMNS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);

  const fetchCanonicalTeam = async (): Promise<TeamMember[]> => {
    const result = await callServerApi<{ members: TeamMember[] }>('/api/team/invitations?resource=members');
    return result.members;
  };

  const refreshTeam = async () => {
    const members = await fetchCanonicalTeam();
    setTeam(members);
  };


  const loadAuthenticatedData = async (userId: string) => {
    if (!supabase) return;

    setWorkspaceStatus('loading');
    setWorkspaceError('');
    try {
      // Contas antigas ou criadas antes dos triggers atuais são reparadas
      // no servidor antes de qualquer consulta protegida por workspace.
      await callServerApi('/api/session/bootstrap', { method: 'POST' });
      const [profile, workspace, canonicalTeam] = await Promise.all([
        loadProfile(userId),
        loadWorkspace(userId),
        fetchCanonicalTeam().catch(error => {
          console.error('StudioDesk: falha ao carregar diretório canônico da equipe', error);
          return null;
        }),
      ]);

      if (!profile) {
        throw new Error('Perfil do usuário não foi criado no Supabase. Verifique o trigger on_auth_user_created.');
      }

      setUserState(prev => ({
        ...prev,
        id: userId,
        ...profile,
      }));

      if (!workspace) throw new Error('A conta não possui um workspace ativo válido.');
      {
        setLeads(workspace.leads ?? []);
        setClients(workspace.clients ?? []);
        setProjects(workspace.projects ?? []);
        setTasks(workspace.tasks ?? []);
        setKanbanColumns(workspace.kanbanColumns.length ? workspace.kanbanColumns : DEFAULT_KANBAN_COLUMNS);
        setTimelineEvents(workspace.timelineEvents ?? []);
        setMessages(workspace.messages ?? []);
        setCommunications(workspace.communications ?? []);
        setCalendarEvents(workspace.calendarEvents ?? []);
        setApprovalRequests(workspace.approvalRequests ?? []);
        setTeam(canonicalTeam ?? workspace.team ?? []);
        setIntegrations(workspace.integrations ?? []);
      }

      setAuthUserId(userId);
      loadedUserRef.current = userId;
      setIsHydrated(true);
      const hasBusinessData = workspace.leads.length > 0 || workspace.clients.length > 0 || workspace.projects.length > 0 || workspace.tasks.length > 0;
      setWorkspaceStatus(hasBusinessData ? 'ready' : 'empty');
      return !profile.businessType || !profile.teamSize;
    } catch (error) {
      console.error('StudioDesk: falha ao carregar dados do Supabase', error);
      const message = error instanceof Error ? error.message : 'Não foi possível carregar seu workspace.';
      addToast('error', 'Falha ao carregar a nuvem', `${message} Nenhum dado local foi sobrescrito.`);
      setAuthUserId(userId);
      setIsHydrated(false);
      setWorkspaceStatus('error');
      setWorkspaceError(message);
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    let authSequence = 0;

    const applySession = async (session: Session | null, event?: string) => {
      const sequence = ++authSequence;
      if (!mounted) return;

      if (!session?.user) {
        loadedUserRef.current = null;
        setAuthUserId(null);
        setUserState(EMPTY_USER);
        setLeads([]);
        setClients([]);
        setProjects([]);
        setTasks([]);
        setKanbanColumns(DEFAULT_KANBAN_COLUMNS);
        setTimelineEvents([]);
        setMessages([]);
        setCommunications([]);
        setCalendarEvents([]);
        setApprovalRequests([]);
        setTeam([]);
        setIntegrations([]);
        setIsHydrated(true);
        setWorkspaceStatus('idle');
        setWorkspaceError('');
        setAuthReady(true);
        if (event === 'SIGNED_OUT') setCurrentView('landing');
        return;
      }

      setAuthReady(false);
      setIsHydrated(false);
      const needsOnboarding = await loadAuthenticatedData(session.user.id);
      if (!mounted || sequence !== authSequence) return;
      if (needsOnboarding === null) {
        setAuthReady(true);
        return;
      }
      setAuthReady(true);

      // O Supabase persiste a sessão no navegador. Ao recarregar, retomamos a
      // área autenticada sem pedir login novamente.
      if (!event || event === 'INITIAL_SESSION') {
        authDestinationRef.current = null;
        const resumeView = sessionStorage.getItem('studiodesk_resume_view');
        if (resumeView === 'dashboard') {
          sessionStorage.removeItem('studiodesk_resume_view');
          setCurrentView('dashboard');
        } else {
          setCurrentView(needsOnboarding ? 'profile_select' : 'dashboard');
        }
      } else if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        const destination = authDestinationRef.current ?? (needsOnboarding ? 'profile_select' : 'dashboard');
        authDestinationRef.current = null;
        setCurrentView(destination);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user.id === loadedUserRef.current) return;
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
        void applySession(session, event);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const retryWorkspaceLoad = async () => {
    if (!authUserId) return;
    setAuthReady(false);
    const needsOnboarding = await loadAuthenticatedData(authUserId);
    setAuthReady(true);
    if (needsOnboarding === true) setCurrentView('profile_select');
    else if (needsOnboarding === false) setCurrentView('dashboard');
  };

  const persistConfirmed = async (operation: Promise<void>, message: string) => {
    try {
      await operation;
    } catch (error) {
      console.error('StudioDesk: mutação não confirmada', error);
      const detail = error instanceof Error ? error.message : message;
      addToast('error', 'Alteração não salva', detail || message);
      throw error;
    }
  };

  // Fase 6: Realtime. Um único canal multiplexa todas as entidades do workspace.
  // Eventos próximos são agrupados para evitar uma nova carga completa por alteração.
  useEffect(() => {
    if (!supabase || !authUserId || !isHydrated) return;

    let cancelled = false;
    let channel: Awaited<ReturnType<typeof subscribeToWorkspaceRealtime>> = null;
    let refreshTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let pendingTables = new Set<RealtimeTable>();

    const scheduleRefresh = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(async () => {
        refreshTimer = null;
        if (cancelled || !authUserId) return;
        const tables = [...pendingTables];
        pendingTables = new Set();
        try {
          const workspace = await loadWorkspace(authUserId);
          if (!workspace || cancelled) return;
          if (workspace.leads) setLeads(workspace.leads);
          if (workspace.clients) setClients(workspace.clients);
          if (workspace.projects) setProjects(workspace.projects);
          if (workspace.tasks) setTasks(workspace.tasks);
          if (workspace.kanbanColumns) setKanbanColumns(workspace.kanbanColumns);
          if (workspace.timelineEvents) setTimelineEvents(workspace.timelineEvents);
          if (workspace.messages) setMessages(workspace.messages);
          if (workspace.communications) setCommunications(workspace.communications);
          if (workspace.calendarEvents) setCalendarEvents(workspace.calendarEvents);
          if (workspace.approvalRequests) setApprovalRequests(workspace.approvalRequests);
          if (workspace.team) setTeam(workspace.team);
          if (workspace.integrations) setIntegrations(workspace.integrations);
          if (tables.some(t => ['messages','communications'].includes(t))) {
            // Mensagens/comunicações chegam sem toast para não interromper o fluxo de trabalho.
          }
        } catch (error) {
          console.error('StudioDesk: falha ao atualizar dados em tempo real', error);
        }
      }, 350);
    };

    const connect = async () => {
      if (cancelled) return;
      if (channel) {
        await removeRealtimeChannel(channel);
        channel = null;
      }
      channel = await subscribeToWorkspaceRealtime(authUserId, {
        onChange: (table) => {
          pendingTables.add(table);
          scheduleRefresh();
        },
        onStatus: (status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (reconnectTimer === null && !cancelled) {
              reconnectTimer = window.setTimeout(() => {
                reconnectTimer = null;
                void connect();
              }, 2500);
            }
          }
        },
      });
    };

    void connect();

    return () => {
      cancelled = true;
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      void removeRealtimeChannel(channel);
    };
  }, [authUserId, isHydrated]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase não está configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.' };
    authDestinationRef.current = 'dashboard';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      authDestinationRef.current = null;
      return { error: error.message };
    }
    return {};
  };

  const signUp = async (name: string, email: string, password: string, companyName: string) => {
    if (!supabase) return { error: 'Supabase ainda não foi configurado.' };

    authDestinationRef.current = 'profile_select';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, company_name: companyName },
        emailRedirectTo: window.location.href.split('#')[0],
      },
    });

    if (error) {
      authDestinationRef.current = null;
      return { error: error.message };
    }

    if (!data.session) authDestinationRef.current = null;

    if (data.user) {
      setUserState(prev => ({
        ...prev,
        id: data.user!.id,
        name,
        email,
        companyName,
      }));
    }

    return { needsEmailConfirmation: !data.session };
  };

  const signOut = async () => {
    if (!supabase) {
      setCurrentView('landing');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      addToast('error', 'Não foi possível sair', error.message);
      return;
    }
    addToast('info', 'Sessão encerrada', 'Você saiu da sua conta do StudioDesk.');
  };

  // Keyboard shortcut for Global Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const canAction = (permission: Permission) => can(user.role, permission);
  const denyAction = (permission: Permission) => {
    if (canAction(permission)) return false;
    addToast('warning', 'Acesso restrito', 'Seu perfil não possui permissão para realizar esta ação.');
    return true;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addTimelineEvent = (
    actor: string,
    action: string,
    details?: string,
    category: TimelineEvent['category'] = 'projeto',
    referenceId?: string
  ) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newEvt: TimelineEvent = {
      id: `evt_${crypto.randomUUID()}`,
      timestamp: now.toISOString(),
      timeString,
      actor,
      action,
      details,
      category,
      referenceId
    };
    void persistConfirmed(entityRepository.timeline.upsert(authUserId || '', newEvt), 'A atividade não pôde ser registrada.')
      .then(() => setTimelineEvents(prev => [newEvt, ...prev]));
  };

  const setPlan = (plan: PlanType) => {
    const details = getPlanDetails(plan);
    setUser(prev => ({ ...prev, plan }));
    addToast('info', `Plano ${details.name} selecionado`, `${details.icon} A escolha será confirmada ao concluir a configuração.`);
  };

  // Lead CRUD
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
    if (denyAction('manage:crm')) throw new Error('Permissão insuficiente');
    const newLead: Lead = {
      ...leadData,
      id: `lead_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    await persistConfirmed(entityRepository.lead.upsert(authUserId || '', newLead), 'O lead não pôde ser salvo na nuvem.');
    setLeads(prev => [newLead, ...prev]);
    addTimelineEvent(user.name, 'cadastrou novo lead', `${newLead.name} (${newLead.company}) cadastrado no CRM.`, 'lead', newLead.id);
    addToast('success', 'Lead Cadastrado', `${newLead.name} foi adicionado ao funil de leads.`);
    return newLead;
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (denyAction('manage:crm')) return;
    const current = leads.find(l => l.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    await persistConfirmed(entityRepository.lead.upsert(authUserId || '', next), 'O lead não pôde ser atualizado.');
    setLeads(prev => prev.map(l => l.id === id ? next : l));
    addToast('info', 'Lead Atualizado', 'As informações do lead foram atualizadas.');
  };

  const deleteLead = async (id: string) => {
    if (denyAction('manage:crm')) return;
    await persistConfirmed(entityRepository.lead.delete(authUserId || '', id), 'O lead não pôde ser excluído.');
    setLeads(prev => prev.filter(l => l.id !== id));
    addToast('warning', 'Lead Removido', 'O lead foi excluído com sucesso.');
  };

  const convertLeadToClient = async (leadId: string, createProject: boolean = true, projectTitle?: string) => {
    if (denyAction('manage:crm')) throw new Error('Permissão insuficiente');
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado');

    // 2. Create client
    const newClient: Client = {
      id: `client_${crypto.randomUUID()}`,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      segment: lead.serviceInterest || 'Comunicação Visual',
      assignedTo: lead.assignedTo || user.name,
      status: 'ativo',
      notes: `Convertido a partir do Lead em ${new Date().toLocaleDateString('pt-BR')}. Notas originais: ${lead.notes}`,
      tags: ['Novo Cliente', 'Origem: ' + lead.source],
      createdAt: new Date().toISOString(),
      leadOriginId: lead.id
    };
    let createdProject: Project | undefined;
    if (createProject) {
      const defaultColumn = kanbanColumns[0] || DEFAULT_KANBAN_COLUMNS[0];
      createdProject = {
        id: `proj_${crypto.randomUUID()}`,
        title: projectTitle || `Projeto Inicial — ${lead.company}`,
        clientId: newClient.id,
        clientName: newClient.company || newClient.name,
        description: `Projeto gerado na conversão do lead: ${lead.serviceInterest || 'Primeiro projeto contratado'}.`,
        assignedTo: lead.assignedTo || user.name,
        startDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'alta',
        status: defaultColumn.title,
        columnId: defaultColumn.id,
        tags: ['Recém-Convertido', 'Prioridade'],
        budget: lead.value || 5000,
        progress: 10,
        createdAt: new Date().toISOString()
      };
    }

    const now = new Date();
    const event: TimelineEvent = {
      id: `evt_${crypto.randomUUID()}`,
      timestamp: now.toISOString(),
      timeString: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      actor: user.name,
      action: 'converteu lead em cliente ativo',
      details: `${lead.name} (${lead.company}) agora é um cliente ativo.${createdProject ? ` Projeto "${createdProject.title}" criado no Kanban.` : ''}`,
      category: 'cliente',
      referenceId: newClient.id,
    };

    try {
      await convertLeadAtomic(leadId, newClient, createdProject, event);
    } catch (error) {
      addToast('error', 'Conversão não realizada', error instanceof Error ? error.message : 'O Supabase não confirmou a conversão.');
      throw error;
    }

    setLeads(prev => prev.map(item => item.id === leadId ? { ...item, status: 'convertido' } : item));
    setClients(prev => [newClient, ...prev]);
    if (createdProject) setProjects(prev => [createdProject!, ...prev]);
    setTimelineEvents(prev => [event, ...prev]);

    addToast('success', 'Lead Convertido com Sucesso!', `${lead.name} agora é um cliente ativo e está disponível no CRM.`);
    return { client: newClient, project: createdProject };
  };

  // Client CRUD
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    if (denyAction('manage:crm')) throw new Error('Permissão insuficiente');
    const newClient: Client = {
      ...clientData,
      id: `client_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    await persistConfirmed(entityRepository.client.upsert(authUserId || '', newClient), 'O cliente não pôde ser salvo na nuvem.');
    setClients(prev => [newClient, ...prev]);
    addTimelineEvent(user.name, 'adicionou novo cliente', `${newClient.name} (${newClient.company}) registrado no sistema.`, 'cliente', newClient.id);
    addToast('success', 'Cliente Cadastrado', `${newClient.name} foi adicionado à carteira.`);
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (denyAction('manage:crm')) return;
    const current = clients.find(c => c.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    await persistConfirmed(entityRepository.client.upsert(authUserId || '', next), 'O cliente não pôde ser atualizado.');
    setClients(prev => prev.map(c => c.id === id ? next : c));
    addToast('info', 'Cliente Atualizado', 'Dados do cliente atualizados.');
  };

  const deleteClient = async (id: string) => {
    if (denyAction('manage:crm')) return;
    await persistConfirmed(entityRepository.client.delete(authUserId || '', id), 'O cliente não pôde ser excluído.');
    setClients(prev => prev.filter(c => c.id !== id));
    addToast('warning', 'Cliente Removido', 'O cliente foi excluído.');
  };

  // Project CRUD & Kanban
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    if (denyAction('manage:projects')) throw new Error('Permissão insuficiente');
    const col = kanbanColumns.find(c => c.id === projectData.columnId) || kanbanColumns[0];
    const newProject: Project = {
      ...projectData,
      id: `proj_${crypto.randomUUID()}`,
      status: col ? col.title : 'BRIEFING & ROTEIRO',
      createdAt: new Date().toISOString()
    };
    await persistConfirmed(upsertProjectAggregate(authUserId || '', newProject), 'O projeto não pôde ser salvo na nuvem.');
    setProjects(prev => [newProject, ...prev]);
    addTimelineEvent(user.name, 'criou um novo projeto', `Projeto "${newProject.title}" para ${newProject.clientName} adicionado à coluna ${newProject.status}.`, 'projeto', newProject.id);
    addToast('success', 'Projeto Criado', `"${newProject.title}" adicionado automaticamente ao Kanban.`);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (denyAction('manage:projects')) return;
    const current = projects.find(p => p.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    await persistConfirmed(upsertProjectAggregate(authUserId || '', next), 'O projeto não pôde ser atualizado.');
    setProjects(prev => prev.map(p => p.id === id ? next : p));
    addToast('info', 'Projeto Atualizado', 'Alterações salvas.');
  };

  const moveProjectToColumn = async (projectId: string, targetColumnId: string) => {
    if (denyAction('manage:kanban')) return;
    const project = projects.find(p => p.id === projectId);
    const targetCol = kanbanColumns.find(c => c.id === targetColumnId);
    if (!project || !targetCol) return;

    if (project.columnId === targetColumnId) return;

    const sourceCol = kanbanColumns.find(c => c.id === project.columnId);
    const sourceTitle = sourceCol ? sourceCol.title : 'Coluna anterior';

    const updatedProject: Project = {
      ...project,
      columnId: targetColumnId,
      status: targetCol.title,
      progress: targetColumnId === 'col_concluido' ? 100 : (targetColumnId === 'col_aprovacao' ? 85 : project.progress)
    };
    await persistConfirmed(upsertProjectAggregate(authUserId || '', updatedProject), 'A movimentação do projeto não foi confirmada.');
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));

    addTimelineEvent(
      user.name,
      `moveu o projeto para "${targetCol.title}"`,
      `"${project.title}" movido de "${sourceTitle}" para "${targetCol.title}". Registrado no histórico para rastreabilidade.`,
      'projeto',
      project.id
    );

    addToast('info', 'Status Atualizado no Kanban', `Projeto movido para ${targetCol.title}.`);
  };

  const deleteProject = async (id: string) => {
    if (denyAction('manage:projects')) return;
    await persistConfirmed(entityRepository.project.delete(authUserId || '', id), 'O projeto não pôde ser excluído.');
    setProjects(prev => prev.filter(p => p.id !== id));
    addToast('warning', 'Projeto Removido', 'O projeto foi removido do Kanban.');
  };

  const submitProjectFeedback = async (
    projectId: string,
    deliverableId: string,
    status: 'aprovado' | 'alteracoes_solicitadas',
    feedbackNotes: string
  ) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const updatedProject: Project = {
      ...proj,
      deliverables: (proj.deliverables ?? []).map(d => d.id === deliverableId ? {
        ...d,
        status,
        feedbackNotes,
        reviewedAt: new Date().toISOString(),
        reviewedBy: `${user.name} (Aprovação Registrada)`
      } : d)
    };
    await persistConfirmed(upsertProjectAggregate(authUserId || '', updatedProject), 'O feedback não pôde ser salvo.');
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));

    addTimelineEvent(
      user.name,
      status === 'aprovado' ? 'aprovou entrega do projeto' : 'registrou solicitação de ajustes na entrega',
      `Feedback registrado no portal de aprovação do StudioDesk: "${feedbackNotes}"`,
      'aprovacao',
      projectId
    );

    addToast(
      status === 'aprovado' ? 'success' : 'warning',
      status === 'aprovado' ? 'Entrega Aprovada!' : 'Alterações Registradas no Histórico',
      status === 'aprovado' ? 'O cliente aprovou o material sem ressalvas.' : 'Os ajustes foram salvos e notificados à equipe de produção.'
    );
  };

  // Task CRUD
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
    if (denyAction('manage:tasks')) throw new Error('Permissão insuficiente');
    const newTask: Task = {
      ...taskData,
      id: `task_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    await persistConfirmed(entityRepository.task.upsert(authUserId || '', newTask), 'A tarefa não pôde ser salva na nuvem.');
    setTasks(prev => [newTask, ...prev]);
    addTimelineEvent(user.name, 'criou uma tarefa', `Tarefa "${newTask.title}" atribuída a ${newTask.assignedTo}.`, 'tarefa', newTask.id);
    addToast('success', 'Tarefa Adicionada', `"${newTask.title}" foi criada.`);
    return newTask;
  };

  const toggleTaskCompleted = async (taskId: string) => {
    if (denyAction('manage:tasks')) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const isNowCompleted = !task.completed;

    const updatedTask: Task = { ...task, completed: isNowCompleted, completedAt: isNowCompleted ? new Date().toISOString() : undefined };
    await persistConfirmed(entityRepository.task.upsert(authUserId || '', updatedTask), 'O status da tarefa não pôde ser atualizado.');
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    if (isNowCompleted) {
      addTimelineEvent(user.name, 'concluiu a tarefa', `Tarefa "${task.title}" marcada como finalizada.`, 'tarefa', task.id);
      addToast('success', 'Tarefa Concluída', `"${task.title}" finalizada.`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (denyAction('manage:tasks')) return;
    await persistConfirmed(entityRepository.task.delete(authUserId || '', taskId), 'A tarefa não pôde ser excluída.');
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addToast('warning', 'Tarefa Excluída', 'A tarefa foi removida.');
  };

  // Kanban Columns
  const addKanbanColumn = async (title: string, color: string = '#66acd7') => {
    if (denyAction('manage:kanban')) return;
    const newCol: KanbanColumn = {
      id: `col_${crypto.randomUUID()}`,
      title: title.toUpperCase(),
      color,
      order: kanbanColumns.length
    };
    await persistConfirmed(entityRepository.column.upsert(authUserId || '', newCol), 'A coluna não pôde ser salva.');
    setKanbanColumns(prev => [...prev, newCol]);
    addToast('success', 'Coluna Adicionada', `Nova coluna "${newCol.title}" criada no Kanban.`);
  };

  const updateKanbanColumn = async (id: string, title: string, color?: string) => {
    if (denyAction('manage:kanban')) return;
    const current = kanbanColumns.find(c => c.id === id);
    if (!current) return;
    const next = { ...current, title: title.toUpperCase(), ...(color ? { color } : {}) };
    await persistConfirmed(entityRepository.column.upsert(authUserId || '', next), 'A coluna não pôde ser atualizada.');
    setKanbanColumns(prev => prev.map(c => c.id === id ? next : c));
    addToast('info', 'Coluna Atualizada', 'Coluna renomeada.');
  };

  const deleteKanbanColumn = async (id: string) => {
    if (denyAction('manage:kanban')) return;
    if (kanbanColumns.length <= 3) {
      addToast('error', 'Ação Bloqueada', 'O Kanban precisa de pelo menos 3 colunas para manter o fluxo.');
      return;
    }
    await persistConfirmed(entityRepository.column.delete(authUserId || '', id), 'A coluna não pôde ser excluída.');
    setKanbanColumns(prev => prev.filter(c => c.id !== id));
    addToast('warning', 'Coluna Removida', 'A coluna foi excluída.');
  };

  // Messages & Communications
  const sendMessage = async (clientId: string, content: string, projectId?: string, mediaType: Message['mediaType'] = 'text') => {
    if (denyAction('manage:communication')) return;
    const now = new Date();
    const newMsg: Message = {
      id: `msg_${crypto.randomUUID()}`,
      sender: 'user',
      senderName: user.name,
      content,
      timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientId,
      projectId,
      mediaType
    };
    await persistConfirmed(entityRepository.message.upsert(authUserId || '', newMsg), 'A mensagem não pôde ser salva.');
    setMessages(prev => [...prev, newMsg]);
    addTimelineEvent(
      user.name,
      'enviou mensagem contextual',
      `Mensagem registrada no histórico de comunicação do cliente e projeto.`,
      'comunicacao',
      clientId
    );
    addToast('success', 'Mensagem Enviada', 'Registrada no histórico contextual do cliente.');
  };

  const addCommunication = async (commData: Omit<Communication, 'id' | 'timestamp'>) => {
    if (denyAction('manage:communication')) return;
    const now = new Date();
    const newComm: Communication = {
      ...commData,
      id: `comm_${crypto.randomUUID()}`,
      timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    await persistConfirmed(entityRepository.communication.upsert(authUserId || '', newComm), 'A comunicação não pôde ser registrada.');
    setCommunications(prev => [...prev, newComm]);
    addTimelineEvent(
      commData.sender || user.name,
      `registrou comunicação via ${commData.channel}`,
      `Mensagem registrada: "${commData.content.substring(0, 60)}${commData.content.length > 60 ? '...' : ''}"`,
      'comunicacao',
      commData.clientId
    );
    addToast('success', 'Comunicação Registrada', 'Histórico atualizado com sucesso.');
  };

  const updateProjectApproval = async (
    projectId: string,
    status: 'pendente' | 'aprovado' | 'ajustes_solicitados',
    comments: ApprovalComment[]
  ) => {
    if (denyAction('manage:approvals')) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const currentApproval = project.mediaApproval || {
      id: 'med_' + projectId,
      title: `${project.title} — Versão V2 (Corte Final)`,
      version: 'V2',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
      status: 'pendente' as const,
      comments: []
    };
    const updatedProject: Project = { ...project, mediaApproval: { ...currentApproval, status, comments } };
    await persistConfirmed(upsertProjectAggregate(authUserId || '', updatedProject), 'A aprovação de mídia não pôde ser atualizada.');
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));

    addTimelineEvent(
      user.name,
      status === 'aprovado' ? 'aprovou mídia do projeto' : 'atualizou status de aprovação de mídia',
      `Status do portal de aprovação atualizado para "${status}".`,
      'aprovacao',
      projectId
    );
  };


  const uploadProjectMedia = async (projectId: string, file: File, kind: 'video' | 'thumbnail') => {
    if (denyAction('manage:approvals')) throw new Error('Permissão insuficiente');
    if (!isSupabaseConfigured || !authUserId) throw new Error('Configure o Supabase e autentique-se para enviar arquivos.');
    const reference = await uploadWorkspaceFile(authUserId, file, kind === 'video' ? 'project-videos' : 'project-thumbnails');
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Projeto não encontrado.');
    const current = project.mediaApproval || { id: 'med_' + projectId, title: `${project.title} — Aprovação`, version: 'V1', status: 'pendente' as const, comments: [] };
    const updated = { ...project, mediaApproval: { ...current, [kind === 'video' ? 'videoUrl' : 'thumbnailUrl']: reference } };
    await updateMediaApprovalAsset(authUserId, projectId, { id: updated.mediaApproval?.id, title: updated.mediaApproval?.title, version: updated.mediaApproval?.version, status: updated.mediaApproval?.status, videoUrl: updated.mediaApproval?.videoUrl, thumbnailUrl: updated.mediaApproval?.thumbnailUrl });
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
  };

  // Calendar Actions
  const addCalendarEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    if (denyAction('manage:calendar')) throw new Error('Permissão insuficiente');
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt_cal_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    await persistConfirmed(entityRepository.calendar.upsert(authUserId || '', newEvent), 'O evento não pôde ser salvo.');
    setCalendarEvents(prev => [...prev, newEvent]);
    addTimelineEvent(
      user.name,
      'agendou novo compromisso',
      `Compromisso "${newEvent.title}" marcado para ${newEvent.date} às ${newEvent.startTime}.`,
      'cliente',
      newEvent.clientId
    );
    addToast('success', 'Evento Agendado', `"${newEvent.title}" foi adicionado à agenda.`);
    return newEvent;
  };

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (denyAction('manage:calendar')) return;
    const current = calendarEvents.find(e => e.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    await persistConfirmed(entityRepository.calendar.upsert(authUserId || '', next), 'O evento não pôde ser atualizado.');
    setCalendarEvents(prev => prev.map(e => e.id === id ? next : e));
    addToast('success', 'Evento Atualizado', 'As alterações na agenda foram salvas.');
  };

  const deleteCalendarEvent = async (id: string) => {
    if (denyAction('manage:calendar')) return;
    await persistConfirmed(entityRepository.calendar.delete(authUserId || '', id), 'O evento não pôde ser excluído.');
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    addToast('info', 'Evento Removido', 'O compromisso foi excluído da agenda.');
  };

  const toggleCalendarEventStatus = async (id: string, status: CalendarEventStatus) => {
    if (denyAction('manage:calendar')) return;
    const current = calendarEvents.find(e => e.id === id);
    if (!current) return;
    const next = { ...current, status };
    await persistConfirmed(entityRepository.calendar.upsert(authUserId || '', next), 'O status do evento não pôde ser atualizado.');
    setCalendarEvents(prev => prev.map(e => e.id === id ? next : e));
    const label = status === 'completed' ? 'Concluído' : status === 'cancelled' ? 'Cancelado' : 'Agendado';
    addToast('success', 'Status da Agenda', `Evento marcado como ${label}.`);
  };

  // Approval Requests Actions
  const addApprovalRequest = async (reqData: Omit<ApprovalRequest, 'id' | 'createdAt'>) => {
    if (denyAction('manage:approvals')) throw new Error('Permissão insuficiente');
    const newReq: ApprovalRequest = {
      ...reqData,
      id: `appr_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    await persistConfirmed(entityRepository.approval.upsert(authUserId || '', newReq), 'A solicitação não pôde ser salva.');
    setApprovalRequests(prev => [newReq, ...prev]);
    addTimelineEvent(
      user.name,
      'abriu nova solicitação de aprovação',
      `Item "${newReq.title}" enviado para validação (${newReq.category}).`,
      'aprovacao',
      newReq.projectId || newReq.clientId
    );
    addToast('success', 'Solicitação Criada', `Item enviado para aprovação do cliente.`);
    return newReq;
  };

  const updateApprovalRequest = async (id: string, updates: Partial<ApprovalRequest>) => {
    if (denyAction('manage:approvals')) return;
    const current = approvalRequests.find(r => r.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    await persistConfirmed(entityRepository.approval.upsert(authUserId || '', next), 'A aprovação não pôde ser atualizada.');
    setApprovalRequests(prev => prev.map(r => r.id === id ? next : r));
    addToast('success', 'Aprovação Atualizada', 'As alterações foram salvas.');
  };

  const deleteApprovalRequest = async (id: string) => {
    if (denyAction('manage:approvals')) return;
    await persistConfirmed(entityRepository.approval.delete(authUserId || '', id), 'A solicitação não pôde ser excluída.');
    setApprovalRequests(prev => prev.filter(r => r.id !== id));
    addToast('info', 'Solicitação Removida', 'O item de aprovação foi excluído.');
  };

  const updateApprovalStatus = async (
    id: string,
    status: ApprovalStatus,
    notes?: string,
    reviewedBy: string = user.name
  ) => {
    if (denyAction('manage:approvals')) return;
    const today = new Date().toISOString().split('T')[0];
    const currentRequest = approvalRequests.find(r => r.id === id);
    if (!currentRequest) return;
    const updatedRequest: ApprovalRequest = {
      ...currentRequest,
      status,
      reviewedBy,
      reviewedAt: today,
      feedbackNotes: status === 'approved' ? (notes || currentRequest.feedbackNotes) : currentRequest.feedbackNotes,
      rejectionReason: status === 'rejected' ? (notes || currentRequest.rejectionReason) : currentRequest.rejectionReason,
      revisionNotes: status === 'needs_revision' ? (notes || currentRequest.revisionNotes) : currentRequest.revisionNotes
    };
    await persistConfirmed(entityRepository.approval.upsert(authUserId || '', updatedRequest), 'O status da aprovação não pôde ser atualizado.');
    setApprovalRequests(prev => prev.map(r => r.id === id ? updatedRequest : r));

    const statusLabels: Record<ApprovalStatus, string> = {
      pending: 'Pendente',
      in_review: 'Em Revisão',
      approved: 'Aprovado',
      rejected: 'Recusado',
      needs_revision: 'Ajustes Solicitados'
    };

    addTimelineEvent(
      reviewedBy,
      `atualizou aprovação para ${statusLabels[status]}`,
      notes ? `Observação: "${notes}"` : `Status atualizado para ${statusLabels[status]}`,
      'aprovacao',
      id
    );

    addToast(
      status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info',
      'Fluxo de Aprovação',
      `Item marcado como "${statusLabels[status]}".`
    );
  };

  // Team
  const addTeamMember = async (memberData: Omit<TeamMember, 'id' | 'projectsCount' | 'status'>) => {
    if (denyAction('manage:team')) return;
    const newMember: TeamMember = {
      ...memberData,
      id: `tm_${crypto.randomUUID()}`,
      projectsCount: 0,
      status: 'ativo'
    };
    await persistConfirmed(entityRepository.team.upsert(authUserId || '', newMember), 'O membro não pôde ser salvo.');
    setTeam(prev => [...prev, newMember]);
    addToast('success', 'Membro Adicionado', `${newMember.name} foi adicionado à equipe com sucesso.`);
  };

  const removeTeamMember = async (id: string): Promise<boolean> => {
    if (denyAction('manage:team')) return false;
    const member = team.find(item => item.id === id);
    if (!member?.userId) {
      addToast('error', 'Membro não removido', 'Atualize a lista da equipe e tente novamente.');
      return false;
    }
    try {
      await callServerApi('/api/team/invitations?resource=members', {
        method: 'DELETE',
        body: JSON.stringify({ userId: member.userId }),
      });
      await refreshTeam();
      addToast('info', 'Membro removido', 'O acesso desse colaborador ao workspace foi encerrado.');
      return true;
    } catch (error) {
      addToast('error', 'Membro não removido', error instanceof Error ? error.message : 'Tente novamente.');
      return false;
    }
  };

  // Integrations
  const toggleIntegration = async (id: string) => {
    if (denyAction('manage:integrations')) return;
    const current = integrations.find(i => i.id === id);
    if (!current) return;
    const nextStatus = current.status === 'conectado' ? 'configuravel' : 'conectado';
    const next = { ...current, status: nextStatus as IntegrationItem['status'], connectedAt: nextStatus === 'conectado' ? new Date().toISOString() : current.connectedAt };
    await persistConfirmed(entityRepository.integration.upsert(authUserId || '', next), 'A integração não pôde ser atualizada.');
    setIntegrations(prev => prev.map(i => i.id === id ? next : i));
    addToast(
      nextStatus === 'conectado' ? 'success' : 'info',
      current.name,
      nextStatus === 'conectado' ? 'Integração ativada e sincronizando dados.' : 'Integração pausada.'
    );
  };


  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedClientId,
        setSelectedClientId,
        selectedProjectId,
        setSelectedProjectId,
        user,
        setUser,
        setPlan,
        leads,
        clients,
        projects,
        tasks,
        kanbanColumns,
        setKanbanColumns,
        timelineEvents,
        messages,
        communications,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        toggleCalendarEventStatus,
        approvalRequests,
        addApprovalRequest,
        updateApprovalRequest,
        deleteApprovalRequest,
        updateApprovalStatus,
        team,
        integrations,
        isSearchOpen,
        setIsSearchOpen,
        toasts,
        addToast,
        removeToast,
        addLead,
        updateLead,
        deleteLead,
        convertLeadToClient,
        addClient,
        updateClient,
        deleteClient,
        addProject,
        updateProject,
        moveProjectToColumn,
        moveProjectColumn: moveProjectToColumn,
        deleteProject,
        submitProjectFeedback,
        updateProjectApproval,
        uploadProjectMedia,
        addTask,
        toggleTaskCompleted,
        deleteTask,
        addKanbanColumn,
        updateKanbanColumn,
        deleteKanbanColumn,
        sendMessage,
        addCommunication,
        addTeamMember,
        removeTeamMember,
        refreshTeam,
        toggleIntegration,
        isSupabaseConfigured,
        isAuthenticated: Boolean(authUserId),
        authReady,
        workspaceStatus,
        workspaceError,
        retryWorkspaceLoad,
        signIn,
        signUp,
        signOut,
        can: canAction,
        role: user.role,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
