import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Bell, 
  Plus, 
  Layers, 
  User, 
  FolderPlus, 
  CheckSquare, 
  UserPlus, 
  Globe, 
  Menu,
  ExternalLink,
  ChevronDown,
  Check,
  Palette,
  Sparkles,
  LogOut
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { BrandCardModal } from '../common/BrandCardModal';
import { getPlanDetails } from '../../data/plans';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenQuickCreate: (type: 'lead' | 'client' | 'project' | 'task') => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenQuickCreate, onOpenSearch }) => {
  const {
    user,
    user: { plan },
    currentView,
    setCurrentView,
    setIsSearchOpen,
    timelineEvents,
    signOut,
    isAuthenticated
  } = useApp();

  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const notifications = timelineEvents.slice(0, 5);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard de Operações';
      case 'leads': return 'Captação & Funil de Leads';
      case 'clients': return 'Carteira de Clientes';
      case 'client_detail': return 'Perfil do Cliente';
      case 'projects': return 'Gestão de Projetos';
      case 'project_detail': return 'Detalhes do Projeto';
      case 'kanban': return 'Fluxo Operacional Kanban';
      case 'tasks': return 'Minhas Tarefas & Prazos';
      case 'schedule': return 'Agenda & Entregas';
      case 'activities': return 'Histórico & Rastreabilidade';
      case 'communication': return 'Comunicação Contextual';
      case 'approval': return 'Portal de Aprovação de Mídias';
      case 'integrations': return 'Integrações & Presença Digital';
      case 'team': return 'Equipe & Permissões';
      case 'settings': return 'Configurações do StudioDesk';
      default: return 'StudioDesk CRM';
    }
  };

  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#DDE3E8] px-4 sm:px-6 flex items-center justify-between z-30 shadow-2xs" id="main-header">
      {/* Left side: Mobile burger + View title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#111111] hover:bg-[#F5F7F9]"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden">
          <Logo size="sm" onClick={() => setCurrentView('dashboard')} />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <h1 className="text-base font-bold text-[#111111]">{getViewTitle()}</h1>
          {(() => {
            const details = getPlanDetails(plan);
            return (
              <span className="text-[11px] font-semibold bg-[#66acd7]/15 text-[#2F6F9C] border border-[#66acd7]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#2F6F9C]" />
                <span>Plano {details.name} ({details.userLimitText})</span>
              </span>
            );
          })()}
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 bg-[#F5F7F9] hover:bg-gray-200 text-[#6B7280] text-xs px-3 py-1.5 rounded-xl border border-[#DDE3E8] transition-colors"
          title="Buscar em todo o sistema (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#2F6F9C]" />
          <span className="hidden md:inline">Buscar clientes, projetos...</span>
          <kbd className="hidden md:inline-block bg-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#DDE3E8] text-[#6B7280]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
            className="flex items-center gap-1.5 bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-xs"
            id="quick-create-btn"
          >
            <Plus className="w-4 h-4 text-[#66acd7]" />
            <span className="hidden sm:inline">Criar</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {isQuickCreateOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#DDE3E8] py-1.5 z-40">
              <button
                onClick={() => { onOpenQuickCreate('lead'); setIsQuickCreateOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#F5F7F9]"
              >
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                Novo Lead
              </button>
              <button
                onClick={() => { onOpenQuickCreate('client'); setIsQuickCreateOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#F5F7F9]"
              >
                <UserPlus className="w-4 h-4 text-[#2F6F9C]" />
                Novo Cliente
              </button>
              <button
                onClick={() => { onOpenQuickCreate('project'); setIsQuickCreateOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#F5F7F9]"
              >
                <FolderPlus className="w-4 h-4 text-[#66acd7]" />
                Novo Projeto
              </button>
              <button
                onClick={() => { onOpenQuickCreate('task'); setIsQuickCreateOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#F5F7F9]"
              >
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Nova Tarefa
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F5F7F9] transition-colors"
            title="Notificações e Atividades"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#66acd7]" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#DDE3E8] p-3 z-40">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3E8] px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">Central de Notificações</span>
                <button
                  onClick={() => { setCurrentView('activities'); setIsNotificationsOpen(false); }}
                  className="text-xs text-[#2F6F9C] hover:underline font-medium"
                >
                  Ver timeline completa
                </button>
              </div>

              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto mt-2">
                {notifications.map(n => (
                  <div key={n.id} className="py-2.5 px-2 hover:bg-[#F5F7F9] rounded-lg transition-colors">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#111111]">{n.actor}</span>
                      <span className="text-[#6B7280]">{n.timeString}</span>
                    </div>
                    <p className="text-xs text-[#2F6F9C] font-medium mt-0.5">{n.action}</p>
                    {n.details && <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">{n.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Brand Guide Specifications Modal trigger */}
        <button
          onClick={() => setIsBrandModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#2F6F9C] border border-[#66acd7]/40 text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all shadow-2xs"
          title="Ver especificações da Identidade Visual StudioDesk"
        >
          <Palette className="w-3.5 h-3.5 text-[#66acd7]" />
          <span className="hidden lg:inline text-[11px]">Guia da Marca</span>
        </button>

        {/* User Profile / System Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F5F7F9] transition-colors"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover border border-[#DDE3E8]"
            />
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-[#111111] block leading-tight">{user.name}</span>
              <span className="text-[10px] text-[#6B7280] block">{user.companyName}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] hidden md:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DDE3E8] py-2 z-40">
              <div className="px-4 py-2 border-b border-[#DDE3E8]">
                <p className="text-xs font-bold text-[#111111]">{user.name}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{user.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase bg-[#66acd7]/20 text-[#2F6F9C] px-2 py-0.5 rounded-full">
                    {user.role.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    {plan === 'empresa' ? 'Plano Empresa' : 'Plano Individual'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setCurrentView('landing'); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#111111] hover:bg-[#F5F7F9]"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2F6F9C]" />
                    Página Comercial / Landing
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                </button>
                <button
                  onClick={() => { setCurrentView('onboarding'); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#111111] hover:bg-[#F5F7F9]"
                >
                  <Layers className="w-4 h-4 text-[#8B5CF6]" />
                  Refazer Onboarding do Sistema
                </button>
                <button
                  onClick={() => { setCurrentView('first_access'); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#111111] hover:bg-[#F5F7F9]"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  Ver Checklist de Primeiro Acesso
                </button>
                <button
                  onClick={() => { setCurrentView('settings'); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#111111] hover:bg-[#F5F7F9]"
                >
                  <User className="w-4 h-4 text-[#6B7280]" />
                  Configurações do Perfil & Empresa
                </button>
              </div>

              <div className="pt-1 border-t border-[#DDE3E8]">
                {isAuthenticated && (
                  <button
                    onClick={() => { void signOut(); setIsUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair da conta
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Brand Specifications Design System Modal */}
      <BrandCardModal 
        isOpen={isBrandModalOpen} 
        onClose={() => setIsBrandModalOpen(false)} 
      />
    </header>
  );
};
