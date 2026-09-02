import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ApprovalRequest, ApprovalStatus, ApprovalCategory, Priority } from '../../types';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Calendar, 
  Building2, 
  FolderKanban, 
  FileVideo, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle,
  LayoutGrid,
  List,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ApprovalRequestModal } from './ApprovalRequestModal';
import { ApprovalDetailModal } from './ApprovalDetailModal';
import { EmptyState } from '../common/EmptyState';

export const ApprovalsView: React.FC = () => {
  const { 
    approvalRequests = [], 
    clients, 
    projects, 
    updateApprovalStatus, 
    deleteApprovalRequest, 
    setSelectedClientId, 
    setSelectedProjectId, 
    setCurrentView 
  } = useApp();

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [clientFilter, setClientFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestToEdit, setRequestToEdit] = useState<ApprovalRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Metrics Calculations
  const totalCount = approvalRequests.length;
  const pendingCount = approvalRequests.filter(r => r.status === 'pending' || r.status === 'in_review').length;
  const approvedCount = approvalRequests.filter(r => r.status === 'approved').length;
  const revisionCount = approvalRequests.filter(r => r.status === 'needs_revision').length;
  const rejectedCount = approvalRequests.filter(r => r.status === 'rejected').length;

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return approvalRequests.filter(req => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'pendentes') {
        matchesTab = req.status === 'pending' || req.status === 'in_review';
      } else if (activeTab === 'aprovados') {
        matchesTab = req.status === 'approved';
      } else if (activeTab === 'ajustes') {
        matchesTab = req.status === 'needs_revision';
      } else if (activeTab === 'recusados') {
        matchesTab = req.status === 'rejected';
      }

      // Dropdown filters
      const matchesClient = clientFilter === 'todos' || req.clientId === clientFilter;
      const matchesCategory = categoryFilter === 'todos' || req.category === categoryFilter;
      const matchesPriority = priorityFilter === 'todos' || req.priority === priorityFilter;

      // Search Query
      const matchesSearch = searchQuery.trim() === '' || 
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.projectTitle && req.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesClient && matchesCategory && matchesPriority && matchesSearch;
    });
  }, [approvalRequests, activeTab, clientFilter, categoryFilter, priorityFilter, searchQuery]);

  const handleOpenCreate = () => {
    setRequestToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (req: ApprovalRequest) => {
    setRequestToEdit(req);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (req: ApprovalRequest) => {
    setSelectedRequest(req);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return { label: 'Aprovado', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
      case 'needs_revision':
        return { label: 'Ajustes Solicitados', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: RotateCcw };
      case 'rejected':
        return { label: 'Recusado', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle };
      case 'in_review':
        return { label: 'Em Análise', bg: 'bg-blue-100 text-[#2F6F9C] border-blue-200', icon: Clock };
      default:
        return { label: 'Pendente', bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
    }
  };

  const getCategoryLabel = (cat: ApprovalCategory) => {
    switch (cat) {
      case 'video': return 'Corte de Vídeo';
      case 'roteiro': return 'Roteiro / Copy';
      case 'design': return 'Design / Arte';
      case 'orcamento': return 'Orçamento';
      case 'contrato': return 'Contrato';
      default: return 'Outro';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="approvals-hub-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
              Portal & Gestão de Aprovações
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pendingCount} pendentes
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Centralize validações de vídeos, roteiros e orçamentos com histórico rastreável.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
            id="btn-new-approval"
          >
            <Plus className="w-4 h-4 text-[#66acd7]" />
            <span>Nova Solicitação</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Aguardando Parecer
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-amber-600">
              {pendingCount}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Aprovados
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-emerald-600">
              {approvedCount}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Ajustes Solicitados
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-[#8B5CF6]">
              {revisionCount}
            </span>
            <RotateCcw className="w-4 h-4 text-[#8B5CF6]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Total de Registros
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-[#111111]">
              {totalCount}
            </span>
            <ShieldCheck className="w-4 h-4 text-[#2F6F9C]" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="bg-white rounded-2xl border border-[#DDE3E8] p-4 shadow-2xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE3E8] pb-3">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'todos', label: 'Todos', count: totalCount },
              { id: 'pendentes', label: 'Pendentes & Em Análise', count: pendingCount },
              { id: 'ajustes', label: 'Ajustes Solicitados', count: revisionCount },
              { id: 'aprovados', label: 'Aprovados', count: approvedCount },
              { id: 'recusados', label: 'Recusados', count: rejectedCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#6B7280] hover:bg-[#F5F7F9] hover:text-[#111111]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-[#66acd7] text-[#111111]' : 'bg-gray-100 text-[#6B7280]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Layout switcher */}
          <div className="flex items-center bg-[#F5F7F9] border border-[#DDE3E8] p-0.5 rounded-xl">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'grid' ? 'bg-white text-[#111111] shadow-2xs' : 'text-[#6B7280]'}`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'table' ? 'bg-white text-[#111111] shadow-2xs' : 'text-[#6B7280]'}`}
              title="Visualização em Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar solicitação..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
            />
          </div>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs text-[#111111] bg-white focus:outline-none focus:border-[#2F6F9C]"
          >
            <option value="todos">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs text-[#111111] bg-white focus:outline-none focus:border-[#2F6F9C]"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="video">Corte de Vídeo</option>
            <option value="roteiro">Roteiro / Copy</option>
            <option value="design">Design / Arte</option>
            <option value="orcamento">Orçamento</option>
            <option value="contrato">Contrato</option>
            <option value="outro">Outro</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs text-[#111111] bg-white focus:outline-none focus:border-[#2F6F9C]"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma solicitação encontrada"
          description="Crie uma nova solicitação de aprovação para validar vídeos e entregáveis com seus clientes."
          actionLabel="Nova Solicitação"
          onAction={handleOpenCreate}
        />
      ) : viewLayout === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(req => {
            const statusBadge = getStatusBadge(req.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={req.id}
                onClick={() => handleOpenDetail(req)}
                className="bg-white rounded-3xl border border-[#DDE3E8] p-6 shadow-2xs hover:border-[#66acd7] transition-all hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6F9C] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {getCategoryLabel(req.category)}
                    </span>

                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-display text-base font-bold text-[#111111] line-clamp-1">
                      {req.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] line-clamp-2 mt-1">
                      {req.description}
                    </p>
                  </div>

                  {/* Meta client & project */}
                  <div className="p-3 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#111111] truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#2F6F9C]" />
                        {req.clientName}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        req.priority === 'urgente' ? 'bg-rose-100 text-rose-800' :
                        req.priority === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {req.priority}
                      </span>
                    </div>

                    {req.projectTitle && (
                      <p className="text-[11px] text-[#6B7280] truncate flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        {req.projectTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="pt-3 border-t border-[#DDE3E8] flex items-center justify-between text-xs text-[#6B7280]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Prazo: {new Date(req.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(req)}
                      className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F5F7F9] rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Excluir esta solicitação?')) {
                          deleteApprovalRequest(req.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F9] text-[#6B7280] font-bold uppercase tracking-wider text-[10px] border-b border-[#DDE3E8]">
                <tr>
                  <th className="p-4">Material / Título</th>
                  <th className="p-4">Cliente & Projeto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Prioridade</th>
                  <th className="p-4">Prazo</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#111111]">
                {filteredRequests.map(req => {
                  const statusBadge = getStatusBadge(req.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenDetail(req)}
                      className="hover:bg-[#F5F7F9] transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-bold">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#2F6F9C] shrink-0" />
                          <span className="truncate max-w-[200px]">{req.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[#111111]">{req.clientName}</p>
                        {req.projectTitle && <p className="text-[11px] text-[#6B7280]">{req.projectTitle}</p>}
                      </td>
                      <td className="p-4">
                        <span className="text-[11px] font-semibold text-[#2F6F9C] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {getCategoryLabel(req.category)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          req.priority === 'urgente' ? 'bg-rose-100 text-rose-800' :
                          req.priority === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="p-4 text-[#6B7280]">
                        {new Date(req.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(req)}
                            className="p-1.5 text-[#6B7280] hover:text-[#111111] rounded-lg"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Excluir solicitação?')) {
                                deleteApprovalRequest(req.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ApprovalRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestToEdit={requestToEdit}
      />

      <ApprovalDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        request={selectedRequest}
        onEdit={req => handleOpenEdit(req)}
      />
    </div>
  );
};
