import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, PriorityLevel } from '../../types';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Clock,
  FolderKanban
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const TasksView: React.FC = () => {
  const { tasks, addTask, toggleTaskCompleted, deleteTask, projects, user, team } = useApp();
  const [activeFilter, setActiveFilter] = useState<'todas' | 'minhas' | 'pendentes' | 'concluidas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newAssignedTo, setNewAssignedTo] = useState(user.name);
  const [newDueDate, setNewDueDate] = useState('2025-05-15');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('alta');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      let matchesFilter = true;
      if (activeFilter === 'minhas') matchesFilter = t.assignedTo.includes(user.name.split(' ')[0]);
      else if (activeFilter === 'pendentes') matchesFilter = !t.completed;
      else if (activeFilter === 'concluidas') matchesFilter = t.completed;

      const q = searchQuery.toLowerCase();
      const matchesSearch = t.title.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [tasks, activeFilter, searchQuery, user.name]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      projectId: newProjectId,
      assignedTo: newAssignedTo,
      dueDate: newDueDate,
      completed: false,
      priority: newPriority
    });
    setNewTitle('');
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="tasks-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
            Central de Tarefas & Entregas
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Controle granular de prazos, roteirização, gravação e edição de projetos.
          </p>
        </div>

        <div className="text-xs font-bold text-[#111111] bg-white p-3 rounded-2xl border border-[#DDE3E8] shadow-2xs flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{completedCount} de {tasks.length} concluídas ({tasks.length ? Math.round((completedCount/tasks.length)*100) : 0}%)</span>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleCreateTask} className="bg-white p-4 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="+ Adicionar nova tarefa e atribuir..."
            className="flex-1 px-4 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
          />

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={newProjectId}
              onChange={e => setNewProjectId(e.target.value)}
              className="px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none max-w-[160px]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>

            <select
              value={newAssignedTo}
              onChange={e => setNewAssignedTo(e.target.value)}
              className="px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none"
            >
              <option value={user.name}>{user.name} (Você)</option>
              {team.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none"
            />

            <button
              type="submit"
              className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-[#66acd7]" />
              <span>Criar</span>
            </button>
          </div>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#DDE3E8] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveFilter('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'todas' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setActiveFilter('minhas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'minhas' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Minhas Tarefas
          </button>
          <button
            onClick={() => setActiveFilter('pendentes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'pendentes' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Pendentes ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setActiveFilter('concluidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'concluidas' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
          />
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nenhuma tarefa encontrada"
          description="Todas as tarefas foram concluídas ou não correspondem ao filtro."
          actionLabel="+ Adicionar Tarefa"
          onAction={() => {}}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#DDE3E8] shadow-2xs divide-y divide-gray-100 overflow-hidden">
          {filteredTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            return (
              <div
                key={task.id}
                onClick={() => toggleTaskCompleted(task.id)}
                className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  task.completed ? 'bg-emerald-50/30 opacity-75' : 'hover:bg-[#F5F7F9]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#6B7280] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${task.completed ? 'line-through text-[#6B7280]' : 'text-[#111111]'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5 flex-wrap">
                      {project && (
                        <span className="text-[#2F6F9C] font-semibold flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" />
                          {project.title}
                        </span>
                      )}
                      <span>•</span>
                      <span>Resp: <strong>{task.assignedTo.split(' ')[0]}</strong></span>
                      <span>•</span>
                      <span className="font-mono">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    task.priority === 'urgente' ? 'bg-rose-100 text-rose-800' :
                    task.priority === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
