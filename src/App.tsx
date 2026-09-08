import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { AuthView } from './components/auth/AuthModal';
import { InvitePasswordSetup } from './components/auth/InvitePasswordSetup';
import { ProfileSelection } from './components/onboarding/ProfileSelection';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { FirstAccessChecklist } from './components/onboarding/FirstAccessChecklist';
import { DashboardView } from './components/dashboard/DashboardView';
import { LeadsView } from './components/leads/LeadsView';
import { ClientsView } from './components/clients/ClientsView';
import { ClientProfileView } from './components/clients/ClientProfileView';
import { KanbanBoardView } from './components/projects/KanbanBoardView';
import { ProjectsListView } from './components/projects/ProjectsListView';
import { ProjectDetailView } from './components/projects/ProjectDetailView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { OperationalMetricsView } from './components/metrics/OperationalMetricsView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { CommunicationHubView } from './components/communication/CommunicationHubView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { TeamView } from './components/team/TeamView';
import { TeamInviteJoin } from './components/team/TeamInviteJoin';
import { SettingsView } from './components/settings/SettingsView';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/Toast';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { LeadModal } from './components/leads/LeadModal';
import { ClientModal } from './components/clients/ClientModal';
import { ProjectModal } from './components/projects/ProjectModal';
import { AccessDenied } from './components/common/AccessDenied';
import { viewPermission } from './lib/permissions';

export const App: React.FC = () => {
  const { currentView, setCurrentView, user, isAuthenticated, authReady, can, workspaceStatus, workspaceError, retryWorkspaceLoad, signOut } = useApp();

  // Modals & Navigation
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [defaultClientIdForProject, setDefaultClientIdForProject] = useState<string | undefined>();

  const isPublicView = ['landing', 'auth', 'login'].includes(currentView);
  const isOnboardingView = ['profile_select', 'onboarding', 'first_access'].includes(currentView);
  const isPublicOrOnboarding = isPublicView || isOnboardingView;

  React.useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated && !isPublicView) {
      setCurrentView('auth');
      return;
    }
    if (!isAuthenticated) return;
    // A sessão restaurada pelo Supabase permanece autenticada após recarregar.
    const permission = viewPermission[currentView];
    if (permission && !can(permission)) setCurrentView('dashboard');
  }, [authReady, isAuthenticated, currentView, can, setCurrentView, isPublicView, user.businessType, user.teamSize]);

  const handleOpenQuickCreate = (type: 'lead' | 'client' | 'project' | 'task') => {
    if (type === 'lead') setIsLeadModalOpen(true);
    else if (type === 'client') setIsClientModalOpen(true);
    else if (type === 'project') {
      setDefaultClientIdForProject(undefined);
      setIsProjectModalOpen(true);
    } else if (type === 'task') {
      setCurrentView('tasks');
    }
  };

  const handleOpenNewProjectForClient = (clientId: string) => {
    setDefaultClientIdForProject(clientId);
    setIsProjectModalOpen(true);
  };

  const restrictedView = Boolean(isAuthenticated && viewPermission[currentView] && !can(viewPermission[currentView]!));

  // Não renderiza a landing enquanto o Supabase restaura a sessão. Isso evita
  // o flash visual landing -> dashboard em contas que já estão autenticadas.
  if (!authReady) {
    return <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center text-xs font-bold text-[#6B7280]">Carregando seu StudioDesk...</div>;
  }

  if (isAuthenticated && workspaceStatus === 'error') {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-xl">
          <h1 className="text-xl font-black text-[#111111]">Não foi possível carregar seu workspace</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Seus dados não foram apagados nem substituídos.</p>
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{workspaceError}</p>
          <div className="mt-5 grid gap-2">
            <button onClick={() => void retryWorkspaceLoad()} className="rounded-xl bg-[#111111] px-4 py-3 text-sm font-bold text-white">Tentar carregar novamente</button>
            <button onClick={() => void signOut()} className="rounded-xl px-4 py-2 text-xs font-semibold text-[#6B7280]">Sair da conta</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex flex-col font-sans selection:bg-[#66acd7]/30">
      {/* 1. PUBLIC & ONBOARDING VIEWS (Full Screen) */}
      {currentView === 'landing' && <LandingPage />}
      {(currentView === 'auth' || currentView === 'login') && <AuthView />}
      {isAuthenticated && currentView === 'profile_select' && <ProfileSelection />}
      {isAuthenticated && currentView === 'onboarding' && <OnboardingWizard />}
      {isAuthenticated && currentView === 'first_access' && (
        <FirstAccessChecklist
          onOpenClientModal={() => setIsClientModalOpen(true)}
          onOpenProjectModal={() => setIsProjectModalOpen(true)}
        />
      )}

      {/* 2. AUTHENTICATED APP WORKSPACE (Header + Sidebar + Content) */}
      {!isPublicOrOnboarding && isAuthenticated && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenQuickCreate={handleOpenQuickCreate}
          />

          <div className="flex-1 min-h-0 overflow-hidden pt-16">
            <Sidebar
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            <main className="h-full min-w-0 overflow-y-auto bg-[#F5F7F9] pb-16 lg:ml-64">
              {restrictedView ? <AccessDenied /> : null}
              {!restrictedView ? <>
              {currentView === 'dashboard' && (
                <DashboardView onOpenQuickCreate={handleOpenQuickCreate} />
              )}
              {currentView === 'leads' && <LeadsView />}
              {currentView === 'clients' && <ClientsView />}
              {currentView === 'client_profile' && (
                <ClientProfileView onOpenNewProjectForClient={handleOpenNewProjectForClient} />
              )}
              {currentView === 'kanban' && <KanbanBoardView />}
              {currentView === 'projects' && <ProjectsListView />}
              {currentView === 'project_detail' && <ProjectDetailView />}
              {currentView === 'tasks' && <TasksView />}
              {(currentView === 'calendar' || currentView === 'schedule') && <CalendarView />}
              {(currentView === 'approvals' || currentView === 'approval') && <ApprovalsView />}
              {(currentView === 'operational_metrics' || currentView === 'metrics') && <OperationalMetricsView />}
              {currentView === 'activities' && <ActivitiesView />}
              {currentView === 'communication' && <CommunicationHubView />}
              {currentView === 'integrations' && <IntegrationsView />}
              {currentView === 'team' && <TeamView />}
              {currentView === 'settings' && <SettingsView />}
              </> : null}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <InvitePasswordSetup />
      <TeamInviteJoin />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        defaultClientId={defaultClientIdForProject}
      />
    </div>
  );
};

export default App;
