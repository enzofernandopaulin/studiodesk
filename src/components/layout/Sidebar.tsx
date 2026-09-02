import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Sparkles, 
  Users, 
  FolderKanban, 
  Columns3, 
  CheckSquare, 
  Calendar, 
  Activity, 
  MessageSquare, 
  ShieldCheck, 
  Workflow, 
  UserCheck, 
  Settings, 
  X,
  Layers,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { ActiveView } from '../../types';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile = () => {} }) => {
  const { 
    currentView, 
    setCurrentView, 
    user: { plan },
    leads, 
    clients, 
    projects, 
    tasks,
    calendarEvents,
    approvalRequests
  } = useApp();

  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const activeLeadsCount = leads.filter(l => l.status !== 'perdido' && l.status !== 'convertido').length;
  const pendingApprovalsCount = (approvalRequests || []).filter(a => a.status === 'pending' || a.status === 'in_review').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEventsCount = (calendarEvents || []).filter(e => e.date === todayStr && e.status === 'scheduled').length;

  const navigationItems: Array<{
    id: ActiveView;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    isCore?: boolean;
    companyOnly?: boolean;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Sparkles, badge: activeLeadsCount, badgeColor: 'bg-[#8B5CF6]/15 text-[#8B5CF6]' },
    { id: 'clients', label: 'Clientes', icon: Users, badge: clients.length, badgeColor: 'bg-[#2F6F9C]/15 text-[#2F6F9C]' },
    { id: 'projects', label: 'Projetos', icon: FolderKanban, badge: projects.length, badgeColor: 'bg-gray-100 text-gray-700' },
    { id: 'kanban', label: 'Kanban', icon: Columns3, isCore: true },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, badge: pendingTasksCount, badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'schedule', label: 'Agenda', icon: Calendar, badge: todayEventsCount > 0 ? todayEventsCount : undefined, badgeColor: 'bg-[#66acd7]/20 text-[#66acd7]' },
    { id: 'approval', label: 'Aprovações', icon: ShieldCheck, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'operational_metrics', label: 'Métricas & Dados', icon: BarChart3 },
    { id: 'activities', label: 'Atividades', icon: Activity },
    { id: 'communication', label: 'Comunicação', icon: MessageSquare },
    { id: 'integrations', label: 'Integrações', icon: Workflow },
    { id: 'team', label: 'Equipe', icon: UserCheck, companyOnly: true },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavClick = (view: ActiveView) => {
    setCurrentView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-x-0 bottom-0 top-16 bg-black/50 z-40 lg:hidden backdrop-blur-2xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-[#111111] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#1a1a1a] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        id="main-sidebar"
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#222222] flex items-center justify-between">
          <Logo 
            size="md" 
            theme="dark" 
            showTagline 
            onClick={() => handleNavClick('dashboard')} 
          />
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Operação & Fluxo
          </div>

          {navigationItems.map(item => {
            if (item.companyOnly && plan !== 'empresa') {
              return null;
            }

            const Icon = item.icon;
            const isActive = currentView === item.id || 
              (item.id === 'clients' && currentView === 'client_detail') ||
              (item.id === 'projects' && currentView === 'project_detail');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#66acd7] text-[#111111] shadow-sm font-bold'
                    : 'text-gray-300 hover:bg-[#222222] hover:text-white'
                }`}
                id={`sidebar-link-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#111111]' : (item.isCore ? 'text-[#66acd7]' : 'text-gray-400 group-hover:text-gray-200')
                  }`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.isCore && !isActive && (
                    <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#66acd7]/20 text-[#66acd7] border border-[#66acd7]/30">
                      Core
                    </span>
                  )}
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-[#111111] text-white' : (item.badgeColor || 'bg-gray-800 text-gray-300')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Feature Callout / Plan Status */}
        <div className="p-3 border-t border-[#222222] space-y-2">
          {plan === 'individual' ? (
            <div className="p-3 bg-[#1c1c1c] rounded-xl border border-[#2d2d2d]">
              <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                <span>Plano Individual</span>
                <span className="text-[10px] text-[#66acd7] bg-[#66acd7]/15 px-1.5 py-0.5 rounded">Ativo</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-tight">
                Múltiplos usuários e integração institucional no Plano Empresa.
              </p>
              <button
                onClick={() => setCurrentView('landing')}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-[#66acd7]/20 hover:bg-[#66acd7]/30 text-[#66acd7] text-xs font-semibold py-1.5 rounded-lg transition-colors border border-[#66acd7]/30"
              >
                Conhecer Empresa
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-br from-[#1c2833] to-[#16202a] rounded-xl border border-[#2F6F9C]/50">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <Layers className="w-3.5 h-3.5 text-[#66acd7]" />
                <span>Página & CRM Conectados</span>
              </div>
              <p className="text-[10px] text-gray-300 leading-tight">
                Do site institucional ao Kanban da sua operação em um fluxo único.
              </p>
              <button
                onClick={() => handleNavClick('integrations')}
                className="mt-2 text-[11px] font-semibold text-[#66acd7] hover:underline flex items-center gap-1"
              >
                Ver status das integrações →
              </button>
            </div>
          )}

          {/* Quick exit back to public landing page */}
          <button
            onClick={() => handleNavClick('landing')}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white py-1.5 transition-colors"
          >
            ← Voltar para Landing Page
          </button>
        </div>
      </aside>
    </>
  );
};
