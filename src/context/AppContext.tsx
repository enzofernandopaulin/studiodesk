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
import { loadProfile, loadWorkspace, saveProfile, saveWorkspace, WorkspaceState } from '../lib/workspaceRepository';
import { entityRepository, upsertProjectAggregate, updateMediaApprovalAsset } from '../lib/entityRepository';
import { uploadWorkspaceFile } from '../lib/storageRepository';
import { can, Permission } from '../lib/permissions';
import { subscribeToWorkspaceRealtime, removeRealtimeChannel, RealtimeTable } from '../lib/realtimeRepository';

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
  addCommunication: (comm: Omit<Communication, 'id' | 'timestamp'>) => void;
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  toggleCalendarEventStatus: (id: string, status: CalendarEventStatus) => void;
  approvalRequests: ApprovalRequest[];
  addApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'createdAt'>) => ApprovalRequest;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
  deleteApprovalRequest: (id: string) => void;
  updateApprovalStatus: (id: string, status: ApprovalStatus, notes?: string, reviewedBy?: string) => void;
  updateProjectApproval: (projectId: string, status: 'pendente' | 'aprovado' | 'ajustes_solicitados', comments: ApprovalComment[]) => void;
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
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  convertLeadToClient: (leadId: string, createProject?: boolean, projectTitle?: string) => { client: Client; project?: Project };
  
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  moveProjectToColumn: (projectId: string, targetColumnId: string) => void;
  moveProjectColumn: (projectId: string, targetColumnId: string) => void;
  deleteProject: (id: string) => void;
  submitProjectFeedback: (projectId: string, deliverableId: string, status: 'aprovado' | 'alteracoes_solicitadas', feedbackNotes: string) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  toggleTaskCompleted: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  
  addKanbanColumn: (title: string, color?: string) => void;
  updateKanbanColumn: (id: string, title: string, color?: string) => void;
  deleteKanbanColumn: (id: string) => void;
  
  sendMessage: (clientId: string, content: string, projectId?: string, mediaType?: 'text' | 'audio' | 'video' | 'file') => void;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'projectsCount' | 'status'>) => void;
  removeTeamMember: (id: string) => void;
  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'projectsCount' | 'status'>) => void;
  toggleIntegration: (id: string) => void;
  
  // Authentication / persistence
  isSupabaseConfigured: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
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

const EMPTY_WORKSPACE: WorkspaceState = {
  leads: [],
  clients: [],
  projects: [],
  tasks: [],
  // Kanban columns are structural defaults for new workspaces.
  kanbanColumns: DEFAULT_KANBAN_COLUMNS,
  timelineEvents: [],
  messages: [],
  communications: [],
  calendarEvents: [],
  approvalRequests: [],
  team: [],
  integrations: [],
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
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [isHydrated, setIsHydrated] = useState(!isSupabaseConfigured);

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


  const buildWorkspaceState = (): WorkspaceState => ({
    leads,
    clients,
    projects,
    tasks,
    kanbanColumns,
    timelineEvents,
    messages,
    communications,
    calendarEvents,
    approvalRequests,
    team,
    integrations,
  });

  const loadAuthenticatedData = async (userId: string) => {
    if (!supabase) return;

    try {
      const [profile, workspace] = await Promise.all([
        loadProfile(userId),
        loadWorkspace(userId),
      ]);

      if (!profile) {
        throw new Error('Perfil do usuário não foi criado no Supabase. Verifique o trigger on_auth_user_created.');
      }

      setUserState(prev => ({
        ...prev,
        id: userId,
        ...profile,
      }));

      if (!workspace) {
        // Primeiro acesso em produção: cria somente a estrutura mínima do workspace.
        // Nenhum dado de cliente ou projeto é criado automaticamente para uma conta nova.
        await saveWorkspace(userId, EMPTY_WORKSPACE);
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
      } else {
        setLeads(workspace.leads ?? []);
        setClients(workspace.clients ?? []);
        setProjects(workspace.projects ?? []);
        setTasks(workspace.tasks ?? []);
        setKanbanColumns(workspace.kanbanColumns ?? []);
        setTimelineEvents(workspace.timelineEvents ?? []);
        setMessages(workspace.messages ?? []);
        setCommunications(workspace.communications ?? []);
        setCalendarEvents(workspace.calendarEvents ?? []);
        setApprovalRequests(workspace.approvalRequests ?? []);
        setTeam(workspace.team ?? []);
        setIntegrations(workspace.integrations ?? []);
      }

      setAuthUserId(userId);
      setIsHydrated(true);
      return !profile.businessType || !profile.teamSize;
    } catch (error) {
      console.error('StudioDesk: falha ao carregar dados do Supabase', error);
      addToast('error', 'Falha ao carregar a nuvem', 'Não foi possível carregar seu workspace. Sua sessão local será encerrada para evitar um estado inconsistente.');
      setAuthUserId(null);
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
      void supabase.auth.signOut({ scope: 'local' });
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
      await refreshRole(session.user.id);

      if (!mounted || sequence !== authSequence) return;
      setAuthReady(true);

      // Ao abrir/recarregar o site, mostramos o login mesmo que exista uma
      // sessão persistida. Um login feito agora continua seguindo ao painel.
      if (!event || event === 'INITIAL_SESSION') {
        authDestinationRef.current = null;
        setCurrentView('auth');
      } else if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        const destination = authDestinationRef.current ?? (needsOnboarding ? 'profile_select' : 'dashboard');
        authDestinationRef.current = null;
        setCurrentView(destination);
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      void applySession(session, event);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fase 3: cada mutação de domínio persiste diretamente na tabela correspondente.
  // Mantemos apenas a persistência de perfil separada, pois o onboarding altera esse objeto.
  useEffect(() => {
    if (!supabase || !authUserId || !isHydrated) return;
    const timer = window.setTimeout(() => {
      void saveProfile(user).catch(error => console.error('StudioDesk: falha ao salvar perfil', error));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [authUserId, isHydrated, user]);

  const persist = (operation: Promise<void>, message = 'A alteração não pôde ser sincronizada com a nuvem.') => {
    if (!supabase || !authUserId) return;
    void operation.catch(error => {
      console.error('StudioDesk: falha na persistência', error);
      addToast('error', 'Sincronização pendente', message);
    });
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

  const refreshRole = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('role, workspace_id').eq('id', userId).maybeSingle();
    if (data?.role) setUserState(prev => ({ ...prev, role: data.role as UserProfile['role'] }));
  };

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
        emailRedirectTo: window.location.origin,
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
      id: 'evt_' + Date.now(),
      timestamp: now.toISOString(),
      timeString,
      actor,
      action,
      details,
      category,
      referenceId
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
    persist(entityRepository.timeline.upsert(authUserId || '', newEvt), 'A atividade foi registrada localmente, mas não pôde ser sincronizada.');
  };

  const setPlan = (plan: PlanType) => {
    const details = getPlanDetails(plan);
    setUser(prev => ({ ...prev, plan }));
    addToast('info', `Plano ${details.name} Ativo`, `${details.icon} Modo ${details.name} (${details.userLimitText}) ativado com sucesso.`);
  };

  // Lead CRUD
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>): Lead => {
    if (denyAction('manage:crm')) throw new Error('Permissão insuficiente');
    const newLead: Lead = {
      ...leadData,
      id: 'lead_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setLeads(prev => [newLead, ...prev]);
    persist(entityRepository.lead.upsert(authUserId || '', newLead), 'O lead foi criado na interface, mas não pôde ser salvo na nuvem.');
    addTimelineEvent(user.name, 'cadastrou novo lead', `${newLead.name} (${newLead.company}) cadastrado no CRM.`, 'lead', newLead.id);
    addToast('success', 'Lead Cadastrado', `${newLead.name} foi adicionado ao funil de leads.`);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    if (denyAction('manage:crm')) return;
    const current = leads.find(l => l.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    setLeads(prev => prev.map(l => l.id === id ? next : l));
    persist(entityRepository.lead.upsert(authUserId || '', next), 'O lead foi atualizado localmente, mas a nuvem não confirmou a alteração.');
    addToast('info', 'Lead Atualizado', 'As informações do lead foram atualizadas.');
  };

  const deleteLead = (id: string) => {
    if (denyAction('manage:crm')) return;
    setLeads(prev => prev.filter(l => l.id !== id));
    persist(entityRepository.lead.delete(authUserId || '', id), 'O lead foi removido da tela, mas a nuvem não confirmou a exclusão.');
    addToast('warning', 'Lead Removido', 'O lead foi excluído com sucesso.');
  };

  const convertLeadToClient = (leadId: string, createProject: boolean = true, projectTitle?: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado');

    // 1. Mark lead as converted
    updateLead(leadId, { status: 'convertido' });

    // 2. Create client
    const newClient: Client = {
      id: 'client_' + Date.now(),
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
    setClients(prev => [newClient, ...prev]);

    let createdProject: Project | undefined;
    if (createProject) {
      const defaultColumn = kanbanColumns[0] || DEFAULT_KANBAN_COLUMNS[0];
      createdProject = {
        id: 'proj_' + Date.now(),
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
      setProjects(prev => [createdProject!, ...prev]);
      persist(upsertProjectAggregate(authUserId || '', createdProject!), 'O projeto da conversão foi criado localmente, mas não pôde ser salvo na nuvem.');
    }

    addTimelineEvent(
      user.name,
      'converteu lead em cliente ativo',
      `${lead.name} (${lead.company}) agora é um cliente ativo.${createdProject ? ` Projeto "${createdProject.title}" criado no Kanban.` : ''}`,
      'cliente',
      newClient.id
    );

    addToast('success', 'Lead Convertido com Sucesso!', `${lead.name} agora é um cliente ativo e está disponível no CRM.`);
    return { client: newClient, project: createdProject };
  };

  // Client CRUD
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    if (denyAction('manage:crm')) throw new Error('Permissão insuficiente');
    const newClient: Client = {
      ...clientData,
      id: 'client_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setClients(prev => [newClient, ...prev]);
    persist(entityRepository.client.upsert(authUserId || '', newClient), 'O cliente foi criado localmente, mas não pôde ser salvo na nuvem.');
    addTimelineEvent(user.name, 'adicionou novo cliente', `${newClient.name} (${newClient.company}) registrado no sistema.`, 'cliente', newClient.id);
    addToast('success', 'Cliente Cadastrado', `${newClient.name} foi adicionado à carteira.`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    if (denyAction('manage:crm')) return;
    const current = clients.find(c => c.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    setClients(prev => prev.map(c => c.id === id ? next : c));
    persist(entityRepository.client.upsert(authUserId || '', next), 'O cliente foi atualizado localmente, mas a nuvem não confirmou a alteração.');
    addToast('info', 'Cliente Atualizado', 'Dados do cliente atualizados.');
  };

  const deleteClient = (id: string) => {
    if (denyAction('manage:crm')) return;
    setClients(prev => prev.filter(c => c.id !== id));
    persist(entityRepository.client.delete(authUserId || '', id), 'O cliente foi removido da tela, mas a nuvem não confirmou a exclusão.');
    addToast('warning', 'Cliente Removido', 'O cliente foi excluído.');
  };

  // Project CRUD & Kanban
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>): Project => {
    if (denyAction('manage:projects')) throw new Error('Permissão insuficiente');
    const col = kanbanColumns.find(c => c.id === projectData.columnId) || kanbanColumns[0];
    const newProject: Project = {
      ...projectData,
      id: 'proj_' + Date.now(),
      status: col ? col.title : 'BRIEFING & ROTEIRO',
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [newProject, ...prev]);
    persist(upsertProjectAggregate(authUserId || '', newProject), 'O projeto foi criado localmente, mas não pôde ser salvo na nuvem.');
    addTimelineEvent(user.name, 'criou um novo projeto', `Projeto "${newProject.title}" para ${newProject.clientName} adicionado à coluna ${newProject.status}.`, 'projeto', newProject.id);
    addToast('success', 'Projeto Criado', `"${newProject.title}" adicionado automaticamente ao Kanban.`);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    if (denyAction('manage:projects')) return;
    const current = projects.find(p => p.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    setProjects(prev => prev.map(p => p.id === id ? next : p));
    persist(upsertProjectAggregate(authUserId || '', next), 'O projeto foi atualizado localmente, mas a nuvem não confirmou a alteração.');
    addToast('info', 'Projeto Atualizado', 'Alterações salvas.');
  };

  const moveProjectToColumn = (projectId: string, targetColumnId: string) => {
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
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    persist(upsertProjectAggregate(authUserId || '', updatedProject), 'A movimentação do projeto foi feita localmente, mas não foi confirmada pela nuvem.');

    addTimelineEvent(
      user.name,
      `moveu o projeto para "${targetCol.title}"`,
      `"${project.title}" movido de "${sourceTitle}" para "${targetCol.title}". Registrado no histórico para rastreabilidade.`,
      'projeto',
      project.id
    );

    addToast('info', 'Status Atualizado no Kanban', `Projeto movido para ${targetCol.title}.`);
  };

  const deleteProject = (id: string) => {
    if (denyAction('manage:projects')) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    persist(entityRepository.project.delete(authUserId || '', id), 'O projeto foi removido da tela, mas a nuvem não confirmou a exclusão.');
    addToast('warning', 'Projeto Removido', 'O projeto foi removido do Kanban.');
  };

  const submitProjectFeedback = (
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
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    persist(upsertProjectAggregate(authUserId || '', updatedProject), 'O feedback foi salvo localmente, mas a nuvem não confirmou a alteração.');

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
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    if (denyAction('manage:tasks')) throw new Error('Permissão insuficiente');
    const newTask: Task = {
      ...taskData,
      id: 'task_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
    persist(entityRepository.task.upsert(authUserId || '', newTask), 'A tarefa foi criada localmente, mas não pôde ser salva na nuvem.');
    addTimelineEvent(user.name, 'criou uma tarefa', `Tarefa "${newTask.title}" atribuída a ${newTask.assignedTo}.`, 'tarefa', newTask.id);
    addToast('success', 'Tarefa Adicionada', `"${newTask.title}" foi criada.`);
    return newTask;
  };

  const toggleTaskCompleted = (taskId: string) => {
    if (denyAction('manage:tasks')) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const isNowCompleted = !task.completed;

    const updatedTask: Task = { ...task, completed: isNowCompleted, completedAt: isNowCompleted ? new Date().toISOString() : undefined };
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    persist(entityRepository.task.upsert(authUserId || '', updatedTask), 'O status da tarefa mudou localmente, mas a nuvem não confirmou a alteração.');

    if (isNowCompleted) {
      addTimelineEvent(user.name, 'concluiu a tarefa', `Tarefa "${task.title}" marcada como finalizada.`, 'tarefa', task.id);
      addToast('success', 'Tarefa Concluída', `"${task.title}" finalizada.`);
    }
  };

  const deleteTask = (taskId: string) => {
    if (denyAction('manage:tasks')) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    persist(entityRepository.task.delete(authUserId || '', taskId), 'A tarefa foi removida da tela, mas a nuvem não confirmou a exclusão.');
    addToast('warning', 'Tarefa Excluída', 'A tarefa foi removida.');
  };

  // Kanban Columns
  const addKanbanColumn = (title: string, color: string = '#66acd7') => {
    if (denyAction('manage:kanban')) return;
    const newCol: KanbanColumn = {
      id: 'col_' + Date.now(),
      title: title.toUpperCase(),
      color,
      order: kanbanColumns.length
    };
    setKanbanColumns(prev => [...prev, newCol]);
    persist(entityRepository.column.upsert(authUserId || '', newCol), 'A coluna foi criada localmente, mas não pôde ser salva na nuvem.');
    addToast('success', 'Coluna Adicionada', `Nova coluna "${newCol.title}" criada no Kanban.`);
  };

  const updateKanbanColumn = (id: string, title: string, color?: string) => {
    if (denyAction('manage:kanban')) return;
    const current = kanbanColumns.find(c => c.id === id);
    if (!current) return;
    const next = { ...current, title: title.toUpperCase(), ...(color ? { color } : {}) };
    setKanbanColumns(prev => prev.map(c => c.id === id ? next : c));
    persist(entityRepository.column.upsert(authUserId || '', next), 'A coluna foi atualizada localmente, mas a nuvem não confirmou a alteração.');
    addToast('info', 'Coluna Atualizada', 'Coluna renomeada.');
  };

  const deleteKanbanColumn = (id: string) => {
    if (denyAction('manage:kanban')) return;
    if (kanbanColumns.length <= 3) {
      addToast('error', 'Ação Bloqueada', 'O Kanban precisa de pelo menos 3 colunas para manter o fluxo.');
      return;
    }
    setKanbanColumns(prev => prev.filter(c => c.id !== id));
    persist(entityRepository.column.delete(authUserId || '', id), 'A coluna foi removida da tela, mas a nuvem não confirmou a exclusão.');
    addToast('warning', 'Coluna Removida', 'A coluna foi excluída.');
  };

  // Messages & Communications
  const sendMessage = (clientId: string, content: string, projectId?: string, mediaType: Message['mediaType'] = 'text') => {
    if (denyAction('manage:communication')) return;
    const now = new Date();
    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      senderName: user.name,
      content,
      timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientId,
      projectId,
      mediaType
    };
    setMessages(prev => [...prev, newMsg]);
    persist(entityRepository.message.upsert(authUserId || '', newMsg), 'A mensagem foi criada localmente, mas não pôde ser salva na nuvem.');
    addTimelineEvent(
      user.name,
      'enviou mensagem contextual',
      `Mensagem registrada no histórico de comunicação do cliente e projeto.`,
      'comunicacao',
      clientId
    );
    addToast('success', 'Mensagem Enviada', 'Registrada no histórico contextual do cliente.');
  };

  const addCommunication = (commData: Omit<Communication, 'id' | 'timestamp'>) => {
    if (denyAction('manage:communication')) return;
    const now = new Date();
    const newComm: Communication = {
      ...commData,
      id: 'comm_' + Date.now(),
      timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setCommunications(prev => [...prev, newComm]);
    persist(entityRepository.communication.upsert(authUserId || '', newComm), 'A comunicação foi registrada localmente, mas não pôde ser salva na nuvem.');
    addTimelineEvent(
      commData.sender || user.name,
      `registrou comunicação via ${commData.channel}`,
      `Mensagem registrada: "${commData.content.substring(0, 60)}${commData.content.length > 60 ? '...' : ''}"`,
      'comunicacao',
      commData.clientId
    );
    addToast('success', 'Comunicação Registrada', 'Histórico atualizado com sucesso.');
  };

  const updateProjectApproval = (
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
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    persist(upsertProjectAggregate(authUserId || '', updatedProject), 'A aprovação de mídia foi atualizada localmente, mas a nuvem não confirmou a alteração.');

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
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
    await updateMediaApprovalAsset(authUserId, projectId, { id: updated.mediaApproval?.id, title: updated.mediaApproval?.title, version: updated.mediaApproval?.version, status: updated.mediaApproval?.status, videoUrl: updated.mediaApproval?.videoUrl, thumbnailUrl: updated.mediaApproval?.thumbnailUrl });
  };

  // Calendar Actions
  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    if (denyAction('manage:calendar')) throw new Error('Permissão insuficiente');
    const newEvent: CalendarEvent = {
      ...eventData,
      id: 'evt_cal_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setCalendarEvents(prev => [...prev, newEvent]);
    persist(entityRepository.calendar.upsert(authUserId || '', newEvent), 'O evento foi criado localmente, mas não pôde ser salvo na nuvem.');
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

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    if (denyAction('manage:calendar')) return;
    const current = calendarEvents.find(e => e.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    setCalendarEvents(prev => prev.map(e => e.id === id ? next : e));
    persist(entityRepository.calendar.upsert(authUserId || '', next), 'O evento foi atualizado localmente, mas a nuvem não confirmou a alteração.');
    addToast('success', 'Evento Atualizado', 'As alterações na agenda foram salvas.');
  };

  const deleteCalendarEvent = (id: string) => {
    if (denyAction('manage:calendar')) return;
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    persist(entityRepository.calendar.delete(authUserId || '', id), 'O evento foi removido da tela, mas a nuvem não confirmou a exclusão.');
    addToast('info', 'Evento Removido', 'O compromisso foi excluído da agenda.');
  };

  const toggleCalendarEventStatus = (id: string, status: CalendarEventStatus) => {
    if (denyAction('manage:calendar')) return;
    const current = calendarEvents.find(e => e.id === id);
    if (!current) return;
    const next = { ...current, status };
    setCalendarEvents(prev => prev.map(e => e.id === id ? next : e));
    persist(entityRepository.calendar.upsert(authUserId || '', next), 'O status do evento mudou localmente, mas a nuvem não confirmou a alteração.');
    const label = status === 'completed' ? 'Concluído' : status === 'cancelled' ? 'Cancelado' : 'Agendado';
    addToast('success', 'Status da Agenda', `Evento marcado como ${label}.`);
  };

  // Approval Requests Actions
  const addApprovalRequest = (reqData: Omit<ApprovalRequest, 'id' | 'createdAt'>) => {
    if (denyAction('manage:approvals')) throw new Error('Permissão insuficiente');
    const newReq: ApprovalRequest = {
      ...reqData,
      id: 'appr_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setApprovalRequests(prev => [newReq, ...prev]);
    persist(entityRepository.approval.upsert(authUserId || '', newReq), 'A solicitação foi criada localmente, mas não pôde ser salva na nuvem.');
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

  const updateApprovalRequest = (id: string, updates: Partial<ApprovalRequest>) => {
    if (denyAction('manage:approvals')) return;
    const current = approvalRequests.find(r => r.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    setApprovalRequests(prev => prev.map(r => r.id === id ? next : r));
    persist(entityRepository.approval.upsert(authUserId || '', next), 'A aprovação foi atualizada localmente, mas a nuvem não confirmou a alteração.');
    addToast('success', 'Aprovação Atualizada', 'As alterações foram salvas.');
  };

  const deleteApprovalRequest = (id: string) => {
    if (denyAction('manage:approvals')) return;
    setApprovalRequests(prev => prev.filter(r => r.id !== id));
    persist(entityRepository.approval.delete(authUserId || '', id), 'A solicitação foi removida da tela, mas a nuvem não confirmou a exclusão.');
    addToast('info', 'Solicitação Removida', 'O item de aprovação foi excluído.');
  };

  const updateApprovalStatus = (
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
    setApprovalRequests(prev => prev.map(r => r.id === id ? updatedRequest : r));
    persist(entityRepository.approval.upsert(authUserId || '', updatedRequest), 'O status da aprovação mudou localmente, mas a nuvem não confirmou a alteração.');

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
  const addTeamMember = (memberData: Omit<TeamMember, 'id' | 'projectsCount' | 'status'>) => {
    if (denyAction('manage:team')) return;
    const newMember: TeamMember = {
      ...memberData,
      id: 'tm_' + Date.now(),
      projectsCount: 0,
      status: 'ativo'
    };
    setTeam(prev => [...prev, newMember]);
    persist(entityRepository.team.upsert(authUserId || '', newMember), 'O membro foi criado localmente, mas não pôde ser salvo na nuvem.');
    addToast('success', 'Membro Adicionado', `${newMember.name} foi adicionado à equipe com sucesso.`);
  };

  const removeTeamMember = (id: string) => {
    if (denyAction('manage:team')) return;
    setTeam(prev => prev.filter(m => m.id !== id));
    persist(entityRepository.team.delete(authUserId || '', id), 'O membro foi removido da tela, mas a nuvem não confirmou a exclusão.');
    addToast('info', 'Membro Removido', 'O colaborador foi removido da equipe.');
  };

  const inviteTeamMember = (memberData: Omit<TeamMember, 'id' | 'projectsCount' | 'status'>) => {
    if (denyAction('manage:team')) return;
    const newMember: TeamMember = {
      ...memberData,
      id: 'tm_' + Date.now(),
      projectsCount: 0,
      status: 'convidado'
    };
    setTeam(prev => [...prev, newMember]);
    persist(entityRepository.team.upsert(authUserId || '', newMember), 'O convite foi criado localmente, mas não pôde ser salvo na nuvem.');
    addToast('success', 'Convite Enviado', `Convite enviado para ${newMember.email}.`);
  };

  // Integrations
  const toggleIntegration = (id: string) => {
    if (denyAction('manage:integrations')) return;
    const current = integrations.find(i => i.id === id);
    if (!current) return;
    const nextStatus = current.status === 'conectado' ? 'configuravel' : 'conectado';
    const next = { ...current, status: nextStatus as IntegrationItem['status'], connectedAt: nextStatus === 'conectado' ? new Date().toISOString() : current.connectedAt };
    setIntegrations(prev => prev.map(i => i.id === id ? next : i));
    persist(entityRepository.integration.upsert(authUserId || '', next), 'A integração mudou localmente, mas a nuvem não confirmou a alteração.');
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
        inviteTeamMember,
        toggleIntegration,
        isSupabaseConfigured,
        isAuthenticated: Boolean(authUserId),
        authReady,
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
