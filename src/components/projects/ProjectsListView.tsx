import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, PriorityLevel } from '../../types';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Columns3, 
  Calendar, 
  DollarSign, 
  User, 
  Trash2, 
  Edit, 
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { ProjectModal } from './ProjectModal';
import { EmptyState } from '../common/EmptyState';

export const ProjectsListView: React.FC = () => {
  const { 
    projects, 
    kanbanColumns, 
    setSelectedProjectId, 
    setCurrentView, 
    deleteProject 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCol = selectedColumnFilter === 'todos' || p.columnId === selectedColumnFilter;
      return matchesSearch && matchesCol;
    });
  }, [projects, searchQuery, selectedColumnFilter]);

  const handleOpenProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project_detail');
  };

  const handleOpenEdit = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setProjectToEdit(proj);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, projId: string) => {
    e.stopPropagation();
    deleteProject(projId);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="projects-list-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
            Lista de Projetos
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Visão consolidada de escopos, orçamentos, prazos e entregas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('kanban')}
            className="bg-[#2F6F9C] hover:bg-[#111111] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <Columns3 className="w-4 h-4 text-[#66acd7]" />
            <span>Ver Modo Kanban</span>
          </button>
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
            id="btn-new-project-list"
          >
            <Plus className="w-4 h-4 text-[#66acd7]" />
            <span>+ Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#DDE3E8] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedColumnFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedColumnFilter === 'todos' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Todos ({projects.length})
          </button>
          {kanbanColumns.map(col => (
            <button
              key={col.id}
              onClick={() => setSelectedColumnFilter(col.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedColumnFilter === col.id ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
              }`}
            >
              {col.title.split(' ')[0]} ({projects.filter(p => p.columnId === col.id).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por projeto ou cliente..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
          />
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Nenhum projeto encontrado"
          description={
            projects.length === 0
              ? "Crie seu primeiro projeto no Kanban para acompanhar o fluxo audiovisual."
              : "Nenhum projeto corresponde ao filtro selecionado."
          }
          actionLabel="+ Novo Projeto"
          onAction={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#DDE3E8] shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDE3E8] bg-[#F5F7F9] text-[#6B7280] font-bold text-[11px] uppercase">
                <th className="py-3.5 px-4">Projeto</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Etapa no Kanban</th>
                <th className="py-3.5 px-4">Responsável</th>
                <th className="py-3.5 px-4">Prazo</th>
                <th className="py-3.5 px-4">Orçamento</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.map(proj => {
                const col = kanbanColumns.find(c => c.id === proj.columnId);
                return (
                  <tr
                    key={proj.id}
                    onClick={() => handleOpenProject(proj.id)}
                    className="hover:bg-[#F5F7F9] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#111111]">{proj.title}</p>
                      <span className="text-[10px] text-[#6B7280]">{proj.tags.join(' • ')}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-[#2F6F9C]">{proj.clientName}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white border border-[#DDE3E8]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col?.color }} />
                        {col?.title}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#111111]">
                      {proj.assignedTo.split(' ')[0]}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {new Date(proj.deadline).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      R$ {proj.budget.toLocaleString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(e, proj)}
                          className="p-1.5 text-[#6B7280] hover:text-[#111111] rounded-lg hover:bg-gray-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, proj.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenProject(proj.id)}
                          className="p-1.5 text-[#2F6F9C] hover:text-[#111111] rounded-lg hover:bg-gray-100"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};
