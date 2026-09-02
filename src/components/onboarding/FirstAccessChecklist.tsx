import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  UserPlus, 
  FolderPlus, 
  Columns3, 
  Globe, 
  Users, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

interface FirstAccessProps {
  onOpenClientModal?: () => void;
  onOpenProjectModal?: () => void;
}

export const FirstAccessChecklist: React.FC<FirstAccessProps> = ({
  onOpenClientModal,
  onOpenProjectModal
}) => {
  const { setCurrentView, user, clients, projects, integrations, team } = useApp();

  const isClientAdded = clients.length > 0;
  const isProjectCreated = projects.length > 0;
  const isSiteConnected = integrations.some(i => i.id === 'int_site' && i.status === 'conectado');
  const isTeamInvited = team.length > 1;

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-[#66acd7]/30">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Logo size="lg" className="mx-auto" />
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mt-2">
            <Sparkles className="w-3.5 h-3.5" />
            Seu espaço está pronto!
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-[#111111] uppercase tracking-tight">
            Bem-vindo ao StudioDesk, {user.name.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto">
            Siga os passos recomendados abaixo para iniciar sua operação integrada sem ruídos.
          </p>
        </div>

        {/* Checklist Card */}
        <div className="bg-white rounded-3xl border border-[#DDE3E8] shadow-xl p-6 sm:p-8 space-y-6" id="first-access-card">
          <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Checklist de Ativação
            </span>
            <span className="text-xs font-semibold text-[#2F6F9C]">
              Passo a Passo Recomendado
            </span>
          </div>

          <div className="space-y-3">
            {/* Step 1: Perfil */}
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Perfil e agência configurados</h4>
                  <p className="text-[11px] text-[#6B7280]">{user.companyName} • Modelo {user.template}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">Concluído</span>
            </div>

            {/* Step 2: Cliente */}
            <div className="p-3.5 bg-[#F5F7F9] hover:bg-blue-50/30 rounded-2xl border border-[#DDE3E8] flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                {isClientAdded ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#6B7280] shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Adicionar primeiro cliente</h4>
                  <p className="text-[11px] text-[#6B7280]">Cadastre contatos, WhatsApp e preferências para abrir histórico</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onOpenClientModal) onOpenClientModal();
                  else setCurrentView('clients');
                }}
                className="text-xs font-bold bg-[#111111] hover:bg-[#2F6F9C] text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#66acd7]" />
                Adicionar
              </button>
            </div>

            {/* Step 3: Projeto */}
            <div className="p-3.5 bg-[#F5F7F9] hover:bg-blue-50/30 rounded-2xl border border-[#DDE3E8] flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                {isProjectCreated ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#6B7280] shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Criar primeiro projeto</h4>
                  <p className="text-[11px] text-[#6B7280]">Defina prazos, responsável e coloque o projeto no Kanban</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onOpenProjectModal) onOpenProjectModal();
                  else setCurrentView('projects');
                }}
                className="text-xs font-bold bg-white border border-[#DDE3E8] hover:bg-gray-100 text-[#111111] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#2F6F9C]" />
                Criar
              </button>
            </div>

            {/* Step 4: Kanban */}
            <div className="p-3.5 bg-[#F5F7F9] hover:bg-blue-50/30 rounded-2xl border border-[#DDE3E8] flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Configurar colunas do Kanban</h4>
                  <p className="text-[11px] text-[#6B7280]">Fluxo audiovisual padrão carregado com sucesso</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('kanban')}
                className="text-xs font-bold text-[#2F6F9C] hover:underline"
              >
                Ver Kanban
              </button>
            </div>

            {/* Step 5: Página Institucional */}
            <div className="p-3.5 bg-[#F5F7F9] hover:bg-blue-50/30 rounded-2xl border border-[#DDE3E8] flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                {isSiteConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#6B7280] shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Conectar página institucional</h4>
                  <p className="text-[11px] text-[#6B7280]">Capte leads diretamente pelo formulário do seu site</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('integrations')}
                className="text-xs font-bold text-[#2F6F9C] hover:underline flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                Conectar
              </button>
            </div>

            {/* Step 6: Equipe */}
            {user.plan === 'empresa' && (
              <div className="p-3.5 bg-[#F5F7F9] hover:bg-blue-50/30 rounded-2xl border border-[#DDE3E8] flex items-center justify-between transition-colors">
                <div className="flex items-center gap-3">
                  {isTeamInvited ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#6B7280] shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-[#111111]">Convidar membros da equipe</h4>
                    <p className="text-[11px] text-[#6B7280]">Editores, filmmakers, atendimento e diretores de arte</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('team')}
                  className="text-xs font-bold text-[#2F6F9C] hover:underline flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  Convidar
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#DDE3E8] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                if (onOpenClientModal) onOpenClientModal();
                else setCurrentView('clients');
              }}
              className="w-full sm:w-auto bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              id="cta-first-client"
            >
              <UserPlus className="w-4 h-4 text-[#66acd7]" />
              <span>Adicionar meu primeiro cliente</span>
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full sm:w-auto text-xs font-bold text-[#2F6F9C] hover:text-[#111111] flex items-center justify-center gap-1.5 py-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ir direto para o Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
