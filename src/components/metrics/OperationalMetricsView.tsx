import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw,
  Award,
  Clock,
  ArrowUpRight,
  PieChart as PieIcon
} from 'lucide-react';

export const OperationalMetricsView: React.FC = () => {
  const { 
    leads = [], 
    clients = [], 
    projects = [], 
    tasks = [], 
    calendarEvents = [], 
    approvalRequests = [] 
  } = useApp();

  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'year' | 'all'>('30d');
  const [metricTab, setMetricTab] = useState<'all' | 'financial' | 'sales' | 'production' | 'quality'>('all');

  // --- 1. FINANCIAL METRICS (Derived dynamically from clients & projects) ---
  const financialData = useMemo(() => {
    const totalContractedMRR = clients.reduce((acc, c) => acc + (c.monthlyRetainer || 0), 0);
    const totalProjectBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const avgTicketProject = projects.length > 0 ? Math.round(totalProjectBudget / projects.length) : 0;
    const activeClientsCount = clients.filter(c => c.status === 'ativo').length;
    const avgClientMRR = activeClientsCount > 0 ? Math.round(totalContractedMRR / activeClientsCount) : 0;

    // Monthly revenue simulation based on real projects & retainer
    const revenueTrend = [
      { month: 'Jan', retainer: Math.round(totalContractedMRR * 0.85), projetos: Math.round(totalProjectBudget * 0.15), total: Math.round(totalContractedMRR * 0.85 + totalProjectBudget * 0.15) },
      { month: 'Fev', retainer: Math.round(totalContractedMRR * 0.9), projetos: Math.round(totalProjectBudget * 0.2), total: Math.round(totalContractedMRR * 0.9 + totalProjectBudget * 0.2) },
      { month: 'Mar', retainer: Math.round(totalContractedMRR * 0.95), projetos: Math.round(totalProjectBudget * 0.22), total: Math.round(totalContractedMRR * 0.95 + totalProjectBudget * 0.22) },
      { month: 'Abr', retainer: totalContractedMRR, projetos: Math.round(totalProjectBudget * 0.25), total: totalContractedMRR + Math.round(totalProjectBudget * 0.25) },
      { month: 'Mai', retainer: totalContractedMRR, projetos: Math.round(totalProjectBudget * 0.35), total: totalContractedMRR + Math.round(totalProjectBudget * 0.35) }
    ];

    return {
      totalContractedMRR,
      totalProjectBudget,
      avgTicketProject,
      avgClientMRR,
      activeClientsCount,
      revenueTrend
    };
  }, [clients, projects]);

  // --- 2. SALES & LEAD CONVERSION METRICS ---
  const salesData = useMemo(() => {
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'convertido').length;
    const inNegotiation = leads.filter(l => l.status === 'proposta_enviada' || l.status === 'em_negociacao').length;
    const qualifiedLeads = leads.filter(l => l.status !== 'novo' && l.status !== 'perdido').length;
    
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const qualificationRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

    // Leads by channel
    const channelCounts: { [k: string]: number } = {};
    leads.forEach(l => {
      const channel = l.source || 'Outro';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    const leadsByChannel = Object.keys(channelCounts).map(k => ({
      name: k.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      quantidade: channelCounts[k]
    }));

    // Funnel Steps
    const funnelSteps = [
      { stage: 'Leads Captados', count: totalLeads, color: '#66acd7' },
      { stage: 'Qualificados', count: qualifiedLeads, color: '#2F6F9C' },
      { stage: 'Em Negociação', count: inNegotiation, color: '#8B5CF6' },
      { stage: 'Convertidos', count: convertedLeads, color: '#10B981' }
    ];

    return {
      totalLeads,
      convertedLeads,
      inNegotiation,
      conversionRate,
      qualificationRate,
      leadsByChannel,
      funnelSteps
    };
  }, [leads]);

  // --- 3. PRODUCTION & OPERATIONAL METRICS ---
  const productionData = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'concluido' || p.progress === 100).length;
    const inProgressProjects = totalProjects - completedProjects;

    // Projects by column / stage
    const stageCounts: { [k: string]: number } = {
      'Briefing / Roteiro': 0,
      'Produção / Gravação': 0,
      'Edição / Pós': 0,
      'Em Aprovação': 0,
      'Finalizado': 0
    };

    projects.forEach(p => {
      if (p.columnId === 'col-roteiro' || p.status?.includes('roteiro')) stageCounts['Briefing / Roteiro']++;
      else if (p.columnId === 'col-producao' || p.status?.includes('producao')) stageCounts['Produção / Gravação']++;
      else if (p.columnId === 'col-edicao' || p.status?.includes('edicao')) stageCounts['Edição / Pós']++;
      else if (p.columnId === 'col-aprovacao' || p.status?.includes('aprovacao')) stageCounts['Em Aprovação']++;
      else stageCounts['Finalizado']++;
    });

    const projectsByStage = Object.keys(stageCounts).map(k => ({
      stage: k,
      total: stageCounts[k]
    }));

    // Task stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      projectsByStage,
      totalTasks,
      completedTasks,
      taskCompletionRate
    };
  }, [projects, tasks]);

  // --- 4. QUALITY & APPROVAL SPEED METRICS ---
  const qualityData = useMemo(() => {
    const totalApprovals = approvalRequests.length;
    const approved = approvalRequests.filter(a => a.status === 'approved').length;
    const revisions = approvalRequests.filter(a => a.status === 'needs_revision').length;
    const pending = approvalRequests.filter(a => a.status === 'pending' || a.status === 'in_review').length;

    const firstPassApprovalRate = totalApprovals > 0 ? Math.round((approved / totalApprovals) * 100) : 0;

    const approvalStatusBreakdown = [
      { name: 'Aprovados', value: approved, color: '#10B981' },
      { name: 'Ajustes Solicitados', value: revisions, color: '#8B5CF6' },
      { name: 'Em Análise / Pendente', value: pending, color: '#F59E0B' }
    ].filter(item => item.value > 0);

    return {
      totalApprovals,
      approved,
      revisions,
      pending,
      firstPassApprovalRate,
      approvalStatusBreakdown
    };
  }, [approvalRequests]);

  const COLORS = ['#66acd7', '#2F6F9C', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8" id="operational-metrics-dashboard">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
              Métricas & Dados Operacionais
            </h2>
            <span className="bg-[#2F6F9C] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              Tempo Real
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Indicadores de conversão de vendas, desempenho de produção, faturamento e qualidade das entregas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center bg-white border border-[#DDE3E8] p-1 rounded-xl shadow-2xs text-xs font-bold">
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === '30d' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === '90d' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === 'year' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === 'all' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              Geral
            </button>
          </div>
        </div>
      </div>

      {/* Metric Categories Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DDE3E8] pb-3">
        {[
          { id: 'all', label: 'Visão Geral Executiva', icon: BarChart3 },
          { id: 'financial', label: 'Financeiro & Contratos', icon: DollarSign },
          { id: 'sales', label: 'Funil de Vendas & Leads', icon: Sparkles },
          { id: 'production', label: 'Produção & Kanban', icon: FolderKanban },
          { id: 'quality', label: 'Aprovações & Qualidade', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = metricTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMetricTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-white border border-[#DDE3E8] text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#66acd7]' : 'text-[#6B7280]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TOP KPI CARDS (Always visible or contextual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Contratado */}
        <div className="bg-white rounded-3xl border border-[#DDE3E8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            <span>MRR Recorrente Ativo</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-black text-[#111111]">
              R$ {financialData.totalContractedMRR.toLocaleString('pt-BR')}
            </span>
            <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{financialData.activeClientsCount} clientes ativos sob contrato</span>
            </p>
          </div>
        </div>

        {/* Lead Conversion Rate */}
        <div className="bg-white rounded-3xl border border-[#DDE3E8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            <span>Taxa de Conversão de Leads</span>
            <div className="p-2 rounded-xl bg-purple-50 text-[#8B5CF6]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-black text-[#2F6F9C]">
              {salesData.conversionRate}%
            </span>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              {salesData.convertedLeads} convertidos de {salesData.totalLeads} oportunidades
            </p>
          </div>
        </div>

        {/* Task On-Time Completion */}
        <div className="bg-white rounded-3xl border border-[#DDE3E8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            <span>Eficiência Operacional</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2F6F9C]">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-black text-[#111111]">
              {productionData.taskCompletionRate}%
            </span>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              {productionData.completedTasks} de {productionData.totalTasks} tarefas finalizadas
            </p>
          </div>
        </div>

        {/* First-pass Approval Rate */}
        <div className="bg-white rounded-3xl border border-[#DDE3E8] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            <span>Taxa de Aprovação Direta</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-display text-3xl font-black text-amber-600">
              {qualityData.firstPassApprovalRate}%
            </span>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              {qualityData.approved} aprovados sem retrabalho crítico
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: FINANCIAL & REVENUE CHARTS */}
      {(metricTab === 'all' || metricTab === 'financial') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Evolution Area Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#DDE3E8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111111] uppercase tracking-tight">
                  Evolução do Faturamento Audiovisual
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Composição mensal entre Fee Recorrente (Retainers) e Projetos Avulsos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2F6F9C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2F6F9C]" />
                  Retainer
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#66acd7]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#66acd7]" />
                  Projetos
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData.revenueTrend}>
                  <defs>
                    <linearGradient id="colorRetainer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2F6F9C" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2F6F9C" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProjetos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#66acd7" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#66acd7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={11} 
                    tickFormatter={val => `R$${(val / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip 
                    formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #DDE3E8', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="retainer" 
                    name="Fee Recorrente" 
                    stroke="#2F6F9C" 
                    fillOpacity={1} 
                    fill="url(#colorRetainer)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projetos" 
                    name="Projetos Avulsos" 
                    stroke="#66acd7" 
                    fillOpacity={1} 
                    fill="url(#colorProjetos)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Client Financial Ticket Card */}
          <div className="lg:col-span-4 bg-[#111111] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="font-display text-sm font-black uppercase tracking-wider text-white">
                  Médias Financeiras
                </h4>
                <DollarSign className="w-4 h-4 text-[#66acd7]" />
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white/10 rounded-2xl">
                  <span className="text-[11px] text-gray-300 uppercase tracking-wider block">
                    Ticket Médio por Projeto
                  </span>
                  <span className="text-2xl font-black font-display text-[#66acd7] mt-1 block">
                    R$ {financialData.avgTicketProject.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="p-4 bg-white/10 rounded-2xl">
                  <span className="text-[11px] text-gray-300 uppercase tracking-wider block">
                    Ticket Médio por Cliente (MRR)
                  </span>
                  <span className="text-2xl font-black font-display text-emerald-400 mt-1 block">
                    R$ {financialData.avgClientMRR.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300">
              <span className="text-[#66acd7] font-bold block mb-1">Previsibilidade Financeira</span>
              {(financialData.totalContractedMRR * 12).toLocaleString('pt-BR')} de receita anual contratada em carteira.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SALES FUNNEL & CHANNELS */}
      {(metricTab === 'all' || metricTab === 'sales') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Funnel Step Bar Chart */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#DDE3E8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111111] uppercase tracking-tight">
                  Funil de Conversão Comercial
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Jornada da oportunidade desde o primeiro contato até o fechamento.
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.funnelSteps} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6B7280" fontSize={11} />
                  <YAxis dataKey="stage" type="category" stroke="#111111" fontSize={11} width={110} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #DDE3E8', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Oportunidades" radius={[0, 8, 8, 0]}>
                    {salesData.funnelSteps.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acquisition Channels Bar Chart */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#DDE3E8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111111] uppercase tracking-tight">
                  Origem dos Leads Captados
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Distribuição por canal de entrada e captação do StudioDesk.
                </p>
              </div>
              <Users className="w-4 h-4 text-[#2F6F9C]" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.leadsByChannel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={10} interval={0} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #DDE3E8', fontSize: '12px' }}
                  />
                  <Bar dataKey="quantidade" name="Leads" fill="#2F6F9C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PRODUCTION KANBAN & APPROVAL QUALITY */}
      {(metricTab === 'all' || metricTab === 'production' || metricTab === 'quality') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects by Kanban Stage */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DDE3E8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111111] uppercase tracking-tight">
                  Distribuição de Projetos por Etapa
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Volume de vídeos e produções alocadas no pipeline Kanban.
                </p>
              </div>
              <FolderKanban className="w-4 h-4 text-[#2F6F9C]" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionData.projectsByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="stage" stroke="#6B7280" fontSize={10} />
                  <YAxis stroke="#6B7280" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #DDE3E8', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" name="Projetos" fill="#111111" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Approval Breakdown Donut Chart */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DDE3E8] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111111] uppercase tracking-tight">
                  Status das Aprovações
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Qualidade e taxa de revisão de cortes e materiais.
                </p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {qualityData.approvalStatusBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma aprovação registrada</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityData.approvalStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {qualityData.approvalStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #DDE3E8', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
