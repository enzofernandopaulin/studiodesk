import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { AuthView } from './components/auth/AuthModal';
import { InvitePasswordSetup } from './components/auth/InvitePasswordSetup';
import { ProfileSelection } from './components/onboarding/ProfileSelection';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { FirstAccessChecklist } from './components/onboarding/FirstAccessChecklist';
import { TeamInviteJoin } from './components/team/TeamInviteJoin';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/Toast';
import { AccessDenied } from './components/common/AccessDenied';
import { viewPermission } from './lib/permissions';

// Telas autenticadas e modais pesados são baixados somente quando usados.
// Isso mantém a restauração da sessão e o dashboard inicial mais leves.
const DashboardView = React.lazy(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const LeadsView = React.lazy(() => import('./components/leads/LeadsView').then(m => ({ default: m.LeadsView })));
const ClientsView = React.lazy(() => import('./components/clients/ClientsView').then(m => ({ default: m.ClientsView })));
const ClientProfileView = React.lazy(() => import('./components/clients/ClientProfileView').then(m => ({ default: m.ClientProfileView })));
const KanbanBoardView = React.lazy(() => import('./components/projects/KanbanBoardView').then(m => ({ default: m.KanbanBoardView })));
const ProjectsListView = React.lazy(() => import('./components/projects/ProjectsListView').then(m => ({ default: m.ProjectsListView })));
const ProjectDetailView = React.lazy(() => import('./components/projects/ProjectDetailView').then(m => ({ default: m.ProjectDetailView })));
const TasksView = React.lazy(() => import('./components/tasks/TasksView').then(m => ({ default: m.TasksView })));
const CalendarView = React.lazy(() => import('./components/calendar/CalendarView').then(m => ({ default: m.CalendarView })));
const ApprovalsView = React.lazy(() => import('./components/approvals/ApprovalsView').then(m => ({ default: m.ApprovalsView })));
const OperationalMetricsView = React.lazy(() => import('./components/metrics/OperationalMetricsView').then(m => ({ default: m.OperationalMetricsView })));
const ActivitiesView = React.lazy(() => import('./components/activities/ActivitiesView').then(m => ({ default: m.ActivitiesView })));
const CommunicationHubView = React.lazy(() => import('./components/communication/CommunicationHubView').then(m => ({ default: m.CommunicationHubView })));
const IntegrationsView = React.lazy(() => import('./components/integrations/IntegrationsView').then(m => ({ default: m.IntegrationsView })));
const TeamView = React.lazy(() => import('./components/team/TeamView').then(m => ({ default: m.TeamView })));
const SettingsView = React.lazy(() => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const GlobalSearchModal = React.lazy(() => import('./components/common/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const LeadModal = React.lazy(() => import('./components/leads/LeadModal').then(m => ({ default: m.LeadModal })));
const ClientModal = React.lazy(() => import('./components/clients/ClientModal').then(m => ({ default: m.ClientModal })));
const ProjectModal = React.lazy(() => import('./components/projects/ProjectModal').then(m => ({ default: m.ProjectModal })));

const ViewLoading = () => (
  <div className="flex min-h-[240px] items-center justify-center text-xs font-bold text-[#6B7280]">
    Carregando módulo...
  </div>
);

const ViewDataError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex min-h-[320px] items-center justify-center p-6">
    <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center">
      <h2 className="text-base font-black text-[#111111]">Não foi possível carregar este módulo</h2>
      <p className="mt-2 text-xs text-[#6B7280]">O restante do workspace continua disponível.</p>
      <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-xl bg-[#111111] px-5 py-2.5 text-xs font-bold text-white">
        Tentar novamente
      </button>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { currentView, setCurrentView, user, isAuthenticated, authReady, can, workspaceStatus, workspaceError, retryWorkspaceLoad, signOut, isCurrentViewDataLoading, currentViewDataError, retryCurrentViewData, hasMoreCurrentViewData, isLoadingMoreCurrentViewData, loadMoreCurrentViewData } = useApp();

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
              {!restrictedView ? <React.Suspense fallback={<ViewLoading />}>
              {isCurrentViewDataLoading ? <ViewLoading /> : currentViewDataError ? (
                <ViewDataError message={currentViewDataError} onRetry={retryCurrentViewData} />
              ) : <>
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
              {hasMoreCurrentViewData && (
                <div className="flex justify-center px-4 pb-8">
                  <button
                    onClick={() => void loadMoreCurrentViewData()}
                    disabled={isLoadingMoreCurrentViewData}
                    className="rounded-xl border border-[#DDE3E8] bg-white px-5 py-2.5 text-xs font-bold text-[#111111] disabled:opacity-50"
                  >
                    {isLoadingMoreCurrentViewData ? 'Carregando...' : 'Carregar mais registros'}
                  </button>
                </div>
              )}
              </>}
              </React.Suspense> : null}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <React.Suspense fallback={null}>
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
      </React.Suspense>
    </div>
  );
};

export default App;
