import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, PriorityLevel } from '../../types';
import { 
  Columns3, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Building2, 
  User, 
  ArrowLeft, 
  ArrowRight, 
  MoreHorizontal, 
  Sparkles,
  FileVideo,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ProjectModal } from './ProjectModal';
import { EmptyState } from '../common/EmptyState';

export const KanbanBoardView: React.FC = () => {
  const { 
    projects, 
    kanbanColumns, 
    moveProjectColumn, 
    setSelectedProjectId, 
    setCurrentView,
    clients,
    team,
    user,
    tasks
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('todos');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('todos');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Drag and drop state
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter(proj => {
      const matchesSearch = 
        proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClient = selectedClientFilter === 'todos' || proj.clientId === selectedClientFilter;
      const matchesPriority = selectedPriorityFilter === 'todos' || proj.priority === selectedPriorityFilter;
      const matchesAssignee = selectedAssigneeFilter === 'todos' || proj.assignedTo === selectedAssigneeFilter;
      return matchesSearch && matchesClient && matchesPriority && matchesAssignee;
    });
  }, [projects, searchQuery, selectedClientFilter, selectedPriorityFilter, selectedAssigneeFilter]);

  const handleDragStart = (projectId: string) => {
    setDraggedProjectId(projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (draggedProjectId) {
      moveProjectColumn(draggedProjectId, columnId);
      setDraggedProjectId(null);
    }
  };

  const handleMoveStep = (e: React.MouseEvent, projectId: string, currentColumnId: string, direction: 'prev' | 'next') => {
    e.stopPropagation();
    const colIndex = kanbanColumns.findIndex(c => c.id === currentColumnId);
    if (colIndex === -1) return;

    if (direction === 'next' && colIndex < kanbanColumns.length - 1) {
      moveProjectColumn(projectId, kanbanColumns[colIndex + 1].id);
    } else if (direction === 'prev' && colIndex > 0) {
      moveProjectColumn(projectId, kanbanColumns[colIndex - 1].id);
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgente':
        return <span className="bg-rose-100 text-rose-800 text-[9px] font-bold uppercase px-2 py-0.2 rounded-full">Urgente</span>;
      case 'alta':
        return <span className="bg-amber-100 text-amber-800 text-[9px] font-bold uppercase px-2 py-0.2 rounded-full">Alta</span>;
      case 'media':
        return <span className="bg-blue-100 text-[#2F6F9C] text-[9px] font-bold uppercase px-2 py-0.2 rounded-full">Média</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[9px] font-bold uppercase px-2 py-0.2 rounded-full">Baixa</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="kanban-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
              Kanban de Produção
            </h2>
            <span className="text-xs font-bold bg-[#66acd7]/20 text-[#2F6F9C] px-2.5 py-0.5 rounded-full border border-[#66acd7]/30">
              Fluxo Audiovisual
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Acompanhe o ciclo de vida completo: Briefing → Gravação → Edição → Revisão → Aprovação → Entrega.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('projects')}
            className="p-2.5 bg-white border border-[#DDE3E8] hover:bg-gray-100 rounded-xl text-xs font-bold text-[#111111] transition-colors"
          >
            Visualização em Lista
          </button>
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
            id="btn-new-project-kanban"
          >
            <Plus className="w-4 h-4 text-[#66acd7]" />
            <span>+ Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#DDE3E8] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Client Filter */}
          <select
            value={selectedClientFilter}
            onChange={e => setSelectedClientFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none"
          >
            <option value="todos">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={e => setSelectedPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssigneeFilter}
            onChange={e => setSelectedAssigneeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none"
          >
            <option value="todos">Todos os Responsáveis</option>
            <option value={user.name}>{user.name}</option>
            {team.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar no Kanban..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
          />
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS (Horizontal scroll on smaller screens) */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[580px]">
        {kanbanColumns.map((column, colIndex) => {
          const colProjects = filteredProjects.filter(p => p.columnId === column.id);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              className="w-72 sm:w-80 shrink-0 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] p-3.5 flex flex-col justify-between min-h-[520px] transition-colors"
              id={`kanban-column-${column.id}`}
            >
              {/* Column Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DDE3E8]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                    <h3 className="font-display text-xs font-black text-[#111111] uppercase tracking-tight truncate max-w-[170px]" title={column.title}>
                      {column.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-[#111111] px-2 py-0.5 rounded-full border border-[#DDE3E8]">
                    {colProjects.length}
                  </span>
                </div>

                {/* Cards List in this column */}
                <div className="space-y-3">
                  {colProjects.map(proj => {
                    const projTasks = tasks.filter(t => t.projectId === proj.id);
                    const completedTasks = projTasks.filter(t => t.completed);

                    return (
                      <div
                        key={proj.id}
                        draggable
                        onDragStart={() => handleDragStart(proj.id)}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setCurrentView('project_detail');
                        }}
                        className="p-4 bg-white rounded-2xl border border-[#DDE3E8] hover:border-[#66acd7] hover:shadow-md cursor-pointer transition-all space-y-3 group"
                        id={`kanban-card-${proj.id}`}
                      >
                        {/* Client and Priority */}
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6F9C] truncate max-w-[130px]" title={proj.clientName}>
                            {proj.clientName}
                          </span>
                          {getPriorityBadge(proj.priority)}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-xs text-[#111111] group-hover:text-[#2F6F9C] transition-colors line-clamp-2">
                          {proj.title}
                        </h4>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {proj.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] font-semibold bg-[#F5F7F9] text-[#6B7280] px-1.5 py-0.2 rounded border border-[#DDE3E8]">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Media Approval badge if column is Aprovação */}
                        {column.id === 'col_aprovacao' && (
                          <div className="p-2 bg-pink-50 rounded-xl border border-pink-200 flex items-center justify-between text-[10px] text-pink-900 font-bold">
                            <span className="flex items-center gap-1">
                              <FileVideo className="w-3.5 h-3.5 text-pink-600" />
                              Versão V2 no Portal
                            </span>
                            <span className="text-pink-700 underline">Abrir</span>
                          </div>
                        )}

                        {/* Task progress & Deadline */}
                        <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 border-t border-[#DDE3E8]">
                          <div className="flex items-center gap-1 font-semibold text-[#111111]">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{completedTasks.length}/{projTasks.length}</span>
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="w-3 h-3 text-[#6B7280]" />
                            <span>{new Date(proj.deadline).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        {/* Quick move arrow buttons for desktop & mobile */}
                        <div className="pt-2 border-t border-[#DDE3E8]/60 flex items-center justify-between text-xs text-[#6B7280]">
                          <span className="text-[10px] truncate max-w-[100px]">Resp: <strong>{proj.assignedTo.split(' ')[0]}</strong></span>
                          
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {colIndex > 0 && (
                              <button
                                onClick={(e) => handleMoveStep(e, proj.id, column.id, 'prev')}
                                className="p-1 rounded bg-[#F5F7F9] hover:bg-gray-200 text-[#111111]"
                                title={`Voltar para ${kanbanColumns[colIndex - 1]?.title}`}
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {colIndex < kanbanColumns.length - 1 && (
                              <button
                                onClick={(e) => handleMoveStep(e, proj.id, column.id, 'next')}
                                className="p-1 rounded bg-[#F5F7F9] hover:bg-[#66acd7] hover:text-white text-[#111111]"
                                title={`Avançar para ${kanbanColumns[colIndex + 1]?.title}`}
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colProjects.length === 0 && (
                    <div className="p-6 border-2 border-dashed border-[#DDE3E8] rounded-2xl text-center">
                      <span className="text-xs text-[#6B7280] italic">Arraste ou crie um projeto aqui</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Column Action */}
              <button
                onClick={() => {
                  setProjectToEdit(null);
                  setIsModalOpen(true);
                }}
                className="mt-3 w-full py-2 bg-white hover:bg-gray-100 text-[#111111] text-xs font-bold rounded-xl border border-[#DDE3E8] transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#2F6F9C]" />
                <span>Adicionar nesta etapa</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};
