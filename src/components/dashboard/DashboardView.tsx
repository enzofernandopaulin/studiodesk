import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  ArrowRight, 
  Clock, 
  Activity, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Check, 
  Building2, 
  Globe, 
  Columns3,
  ExternalLink
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  onOpenQuickCreate: (type: 'lead' | 'client' | 'project' | 'task') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQuickCreate }) => {
  const { 
    user, 
    leads, 
    clients, 
    projects, 
    tasks, 
    kanbanColumns, 
    timelineEvents, 
    setCurrentView, 
    setSelectedClientId, 
    setSelectedProjectId,
    toggleTaskCompleted
  } = useApp();

  const activeLeadsCount = leads.filter(l => l.status === 'novo' || l.status === 'em_contato' || l.status === 'qualificado').length;
  const activeProjectsCount = projects.filter(p => p.columnId !== 'col_concluido').length;
  const pendingTasks = tasks.filter(t => !t.completed);

  // Upcoming deadlines
  const upcomingProjects = [...projects]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  // Recent timeline
  const recentActivities = timelineEvents.slice(0, 5);

  if (leads.length === 0 && clients.length === 0 && projects.length === 0) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DDE3E8] space-y-3">
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight">
            Bom dia, {user.name.split(' ')[0]}.
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Seu espaço de trabalho está pronto para receber o primeiro contato de cliente e cadastrar seu primeiro projeto.
          </p>
        </div>

        <EmptyState
          icon={FolderKanban}
          title="Nenhum dado ativo no momento"
          description="Seu workspace ainda está vazio. Cadastre um cliente ou um lead para começar a acompanhar métricas reais."
          actionLabel="Adicionar Primeiro Cliente"
          onAction={() => onOpenQuickCreate('client')}
          secondaryActionLabel="Criar Primeiro Lead"
          onSecondaryAction={() => onOpenQuickCreate('lead')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8" id="dashboard-container">
      {/* Top Greeting & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
              Bom dia, {user.name.split(' ')[0]}.
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Aqui está a visão consolidada da sua operação criativa na <strong>{user.companyName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('kanban')}
            className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <Columns3 className="w-4 h-4 text-[#66acd7]" />
            <span>Abrir Kanban de Produção</span>
          </button>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: NOVOS LEADS */}
        <div 
          onClick={() => setCurrentView('leads')}
          className="p-5 bg-white rounded-2xl border border-[#DDE3E8] hover:border-[#8B5CF6] transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Novos Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl sm:text-4xl font-black text-[#111111]">{activeLeadsCount}</span>
            <span className="text-[11px] font-semibold text-[#8B5CF6] flex items-center gap-0.5">
              Site Integrado
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">Oportunidades em qualificação</p>
        </div>

        {/* Card 2: CLIENTES */}
        <div 
          onClick={() => setCurrentView('clients')}
          className="p-5 bg-white rounded-2xl border border-[#DDE3E8] hover:border-[#2F6F9C] transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Clientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2F6F9C]/15 text-[#2F6F9C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl sm:text-4xl font-black text-[#111111]">{clients.length}</span>
            <span className="text-[11px] font-semibold text-[#2F6F9C] flex items-center gap-0.5">
              Carteira
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">Contas ativas e recorrentes</p>
        </div>

        {/* Card 3: PROJETOS ATIVOS */}
        <div 
          onClick={() => setCurrentView('projects')}
          className="p-5 bg-white rounded-2xl border border-[#DDE3E8] hover:border-[#66acd7] transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Projetos Ativos
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#66acd7]/20 text-[#2F6F9C] flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl sm:text-4xl font-black text-[#111111]">{activeProjectsCount}</span>
            <span className="text-[11px] font-semibold text-[#2F6F9C] flex items-center gap-0.5">
              Em Produção
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">Fluxo audiovisual em andamento</p>
        </div>

        {/* Card 4: TAREFAS PENDENTES */}
        <div 
          onClick={() => setCurrentView('tasks')}
          className="p-5 bg-white rounded-2xl border border-[#DDE3E8] hover:border-emerald-500 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Tarefas Pendentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl sm:text-4xl font-black text-[#111111]">{pendingTasks.length}</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
              Checklist
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">Prazos e entregas atribuídas</p>
        </div>
      </div>

      {/* SECTION: MINI KANBAN - PROJETOS EM ANDAMENTO */}
      <div className="bg-white rounded-2xl border border-[#DDE3E8] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-black text-[#111111] uppercase tracking-tight">
              Projetos em Andamento
            </h3>
            <p className="text-xs text-[#6B7280]">Distribuição em tempo real no fluxo Kanban</p>
          </div>
          <button
            onClick={() => setCurrentView('kanban')}
            className="text-xs font-bold text-[#2F6F9C] hover:underline flex items-center gap-1"
          >
            Ver Kanban Completo →
          </button>
        </div>

        {/* Mini Kanban Columns Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {kanbanColumns.map(col => {
            const colProjects = projects.filter(p => p.columnId === col.id);
            return (
              <div key={col.id} className="bg-[#F5F7F9] p-3 rounded-xl border border-[#DDE3E8] flex flex-col justify-between min-h-[140px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-1.5">
                    <span className="text-[10px] font-bold text-[#111111] uppercase truncate" title={col.title}>
                      {col.title.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold bg-white text-[#111111] px-1.5 py-0.2 rounded border border-[#DDE3E8]">
                      {colProjects.length}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {colProjects.slice(0, 2).map(proj => (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setCurrentView('project_detail');
                        }}
                        className="p-2 bg-white rounded-lg border border-[#DDE3E8] hover:border-[#66acd7] cursor-pointer transition-all shadow-2xs"
                      >
                        <p className="text-[11px] font-bold text-[#111111] truncate">{proj.title}</p>
                        <span className="text-[9px] text-[#6B7280] block truncate">{proj.clientName}</span>
                      </div>
                    ))}
                    {colProjects.length === 0 && (
                      <span className="text-[10px] text-gray-400 italic block py-2 text-center">Vazio</span>
                    )}
                  </div>
                </div>

                <div className="h-1 w-full rounded-full mt-2" style={{ backgroundColor: col.color }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-COLUMN SECTION: PRÓXIMOS PRAZOS & ATIVIDADES RECENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Próximos Prazos (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DDE3E8] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2F6F9C]" />
              <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
                Próximos Prazos
              </h3>
            </div>
            <button
              onClick={() => setCurrentView('projects')}
              className="text-xs font-semibold text-[#2F6F9C] hover:underline"
            >
              Ver todos os projetos
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDE3E8] text-[#6B7280] font-semibold text-[11px] uppercase">
                  <th className="pb-2.5">Projeto</th>
                  <th className="pb-2.5">Cliente</th>
                  <th className="pb-2.5">Prazo</th>
                  <th className="pb-2.5">Responsável</th>
                  <th className="pb-2.5">Prioridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingProjects.map(proj => (
                  <tr 
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setCurrentView('project_detail');
                    }}
                    className="hover:bg-[#F5F7F9] cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-bold text-[#111111] pr-2 max-w-[180px] truncate">
                      {proj.title}
                    </td>
                    <td className="py-3 text-[#6B7280] pr-2 truncate">
                      {proj.clientName}
                    </td>
                    <td className="py-3 font-mono font-medium text-[#111111] pr-2">
                      {new Date(proj.deadline).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 text-[#6B7280] pr-2 truncate">
                      {proj.assignedTo.split(' ')[0]}
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        proj.priority === 'urgente' 
                          ? 'bg-rose-100 text-rose-800' 
                          : proj.priority === 'alta'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-50 text-[#2F6F9C]'
                      }`}>
                        {proj.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Atividades Recentes / Timeline (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DDE3E8] p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8B5CF6]" />
                <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
                  Atividades Recentes
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('activities')}
                className="text-xs font-semibold text-[#8B5CF6] hover:underline"
              >
                Timeline
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.map(evt => (
                <div key={evt.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#66acd7] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111] truncate">{evt.actor}</span>
                      <span className="text-[10px] font-mono text-[#6B7280] shrink-0">{evt.timeString}</span>
                    </div>
                    <p className="text-[11px] text-[#2F6F9C] font-semibold">{evt.action}</p>
                    {evt.details && (
                      <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">{evt.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#DDE3E8]">
            <button
              onClick={() => setCurrentView('activities')}
              className="w-full bg-[#F5F7F9] hover:bg-gray-200 text-[#111111] text-xs font-bold py-2 rounded-xl transition-colors text-center block"
            >
              Ver Todas as Atividades e Logs de Rastreabilidade
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: INSIGHTS & MÉTRICAS DO SISTEMA */}
      <div className="bg-white rounded-2xl border border-[#DDE3E8] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
              Métricas Operacionais & Insights
            </h3>
          </div>
          <span className="text-[11px] text-[#6B7280]">Indicadores do fluxo de trabalho</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8]">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase">Taxa de Conversão de Leads</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-[#111111]">68.4%</span>
              <span className="text-xs font-bold text-emerald-600">+12% vs mês ant.</span>
            </div>
            <span className="text-[10px] text-[#6B7280] block mt-1">Formulário integrado + CRM</span>
          </div>

          <div className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8]">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase">Tempo Médio de Aprovação</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-[#2F6F9C]">1.4 dias</span>
              <span className="text-xs font-bold text-emerald-600">-60% tempo</span>
            </div>
            <span className="text-[10px] text-[#6B7280] block mt-1">Portal sem áudios soltos</span>
          </div>

          <div className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8]">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase">Leads por Origem (Site)</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-[#8B5CF6]">72%</span>
              <span className="text-xs text-[#6B7280]">Site Institucional</span>
            </div>
            <span className="text-[10px] text-[#6B7280] block mt-1">Captados automaticamente</span>
          </div>

          <div className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8]">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase">Entregas no Prazo</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-emerald-700">96.8%</span>
              <span className="text-xs text-emerald-600">Dentro do prazo</span>
            </div>
            <span className="text-[10px] text-[#6B7280] block mt-1">Visibilidade total no Kanban</span>
          </div>
        </div>
      </div>
    </div>
  );
};
