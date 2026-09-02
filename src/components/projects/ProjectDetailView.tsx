import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  CheckSquare, 
  MessageSquare, 
  FileVideo, 
  Paperclip, 
  History, 
  Edit, 
  Trash2, 
  Plus, 
  Columns3, 
  CheckCircle2, 
  Circle,
  ExternalLink,
  Send
} from 'lucide-react';
import { MediaApprovalView } from './MediaApprovalView';
import { ProjectModal } from './ProjectModal';

export const ProjectDetailView: React.FC = () => {
  const { 
    projects = [], 
    selectedProjectId, 
    setSelectedProjectId, 
    setCurrentView, 
    kanbanColumns = [], 
    moveProjectToColumn, 
    deleteProject,
    tasks = [], 
    addTask, 
    toggleTaskCompleted,
    communications = [],
    addCommunication,
    timelineEvents = [],
    user
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tarefas' | 'aprovacao' | 'comunicacao' | 'arquivos' | 'historico'>('tarefas');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [msgInput, setMsgInput] = useState('');

  const safeProjects = projects || [];
  const safeColumns = kanbanColumns || [];
  const safeTasks = tasks || [];
  const safeComms = communications || [];
  const safeEvents = timelineEvents || [];

  const project = safeProjects.find(p => p.id === selectedProjectId) || safeProjects[0];

  if (!project) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-[#6B7280]">Projeto não encontrado.</p>
        <button
          onClick={() => setCurrentView('kanban')}
          className="text-xs font-bold text-[#2F6F9C] hover:underline"
        >
          ← Voltar para o Kanban
        </button>
      </div>
    );
  }

  const projectTasks = safeTasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.completed);
  const taskProgress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

  const currentColumn = safeColumns.find(c => c.id === project.columnId || c.id === project.status) || safeColumns[0];
  const projectCommunications = safeComms.filter(c => c.projectId === project.id);
  const projectEvents = safeEvents.filter(e => e.referenceId === project.id || (e as any).entityId === project.id);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (addTask) {
      addTask({
        title: newTaskTitle.trim(),
        projectId: project.id,
        projectTitle: project.title,
        clientId: project.clientId,
        clientName: project.clientName,
        assignedTo: project.assignedTo,
        deadline: project.deadline,
        completed: false,
        priority: project.priority
      });
    }
    setNewTaskTitle('');
  };

  const handleSendProjectMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    if (addCommunication) {
      addCommunication({
        clientId: project.clientId,
        projectId: project.id,
        channel: 'interno',
        sender: user?.name || 'Usuário',
        content: msgInput.trim(),
        status: 'enviado'
      });
    }
    setMsgInput('');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="project-detail-view">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('kanban')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Kanban</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 bg-white hover:bg-gray-100 border border-[#DDE3E8] rounded-xl text-xs font-bold text-[#111111] flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => {
              deleteProject(project.id);
              setCurrentView('kanban');
            }}
            className="p-2 bg-white hover:bg-rose-50 border border-[#DDE3E8] rounded-xl text-xs font-bold text-rose-600 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="bg-white rounded-3xl border border-[#DDE3E8] p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6F9C] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                {project.clientName}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                project.priority === 'urgente' ? 'bg-rose-100 text-rose-800' :
                project.priority === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
              }`}>
                Prioridade {project.priority}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-xs sm:text-sm text-[#6B7280] max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Kanban Stage Selector */}
          <div className="bg-[#F5F7F9] p-4 rounded-2xl border border-[#DDE3E8] space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#6B7280] uppercase text-[10px]">Etapa no Kanban:</span>
              <span className="font-bold text-[#111111] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColumn?.color }} />
                {currentColumn?.title}
              </span>
            </div>

            <select
              value={project.columnId}
              onChange={e => moveProjectToColumn(project.id, e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#DDE3E8] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-[#66acd7] cursor-pointer"
            >
              {kanbanColumns.map(c => (
                <option key={c.id} value={c.id}>Mover para: {c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#DDE3E8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[#6B7280]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Prazo Final</span>
              <span className="text-xs font-bold text-[#111111]">
                {new Date(project.deadline).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[#6B7280]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Responsável</span>
              <span className="text-xs font-bold text-[#111111]">{project.assignedTo}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[#6B7280]">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Orçamento</span>
              <span className="text-xs font-bold text-emerald-700">
                R$ {project.budget.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[#6B7280]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-[#6B7280] uppercase mb-1">
                <span>Progresso</span>
                <span>{taskProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${taskProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-[#DDE3E8] pt-2 overflow-x-auto">
          {[
            { id: 'tarefas', label: `Tarefas & Checklist (${projectTasks.length})` },
            { id: 'aprovacao', label: 'Aprovação de Mídia & Vídeo' },
            { id: 'comunicacao', label: `Comunicação & Chat (${projectCommunications.length})` },
            { id: 'arquivos', label: 'Arquivos & Entregas' },
            { id: 'historico', label: 'Histórico & Logs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#2F6F9C] text-[#2F6F9C]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: TAREFAS & CHECKLIST */}
      {activeTab === 'tarefas' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
                Checklist Operacional do Projeto
              </h3>
              <p className="text-xs text-[#6B7280]">Tarefas atribuídas para a equipe de roteiro, captação e edição.</p>
            </div>
            <span className="text-xs font-bold text-[#2F6F9C]">
              {completedTasks.length} de {projectTasks.length} concluídas
            </span>
          </div>

          {/* Add task bar */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Adicionar nova tarefa (Ex: Exportar versão Reels 9:16)..."
              className="flex-1 px-4 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
            />
            <button
              type="submit"
              className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#66acd7]" />
              <span>Adicionar</span>
            </button>
          </form>

          {/* Task list */}
          <div className="space-y-2">
            {projectTasks.map(t => (
              <div
                key={t.id}
                onClick={() => toggleTaskCompleted(t.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  t.completed ? 'bg-emerald-50/40 border-emerald-200 opacity-80' : 'bg-white border-[#DDE3E8] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {t.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#6B7280] shrink-0" />
                  )}
                  <div>
                    <p className={`text-xs font-bold ${t.completed ? 'line-through text-[#6B7280]' : 'text-[#111111]'}`}>
                      {t.title}
                    </p>
                    <span className="text-[10px] text-[#6B7280]">
                      Responsável: {t.assignedTo.split(' ')[0]} • Prazo: {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  t.priority === 'urgente' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: APROVAÇÃO DE MÍDIA */}
      {activeTab === 'aprovacao' && (
        <MediaApprovalView project={project} />
      )}

      {/* TAB: COMUNICAÇÃO & CHAT */}
      {activeTab === 'comunicacao' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-6">
          <div>
            <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
              Chat & Alinhamento do Projeto
            </h3>
            <p className="text-xs text-[#6B7280]">
              Mural unificado de atualizações internas e decisões de produção.
            </p>
          </div>

          <form onSubmit={handleSendProjectMsg} className="space-y-3">
            <textarea
              rows={3}
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              placeholder="Digite uma mensagem para a equipe ou registre um alinhamento..."
              className="w-full p-3 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#2F6F9C] hover:bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Mensagem</span>
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {projectCommunications.map(c => (
              <div key={c.id} className="p-3.5 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111111]">{c.sender}</span>
                  <span className="text-[10px] font-mono text-[#6B7280]">{c.timestamp}</span>
                </div>
                <p className="text-[#6B7280]">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ARQUIVOS & ENTREGÁVEIS */}
      {activeTab === 'arquivos' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
              Arquivos & Links de Entrega
            </h3>
            <button className="text-xs font-bold text-[#2F6F9C] hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              Adicionar Link / Arquivo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileVideo className="w-5 h-5 text-[#2F6F9C]" />
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Master 4K — ProRes 422</h4>
                  <span className="text-[10px] text-[#6B7280]">3.2 GB • Google Drive</span>
                </div>
              </div>
              <a href="#" className="text-xs font-bold text-[#2F6F9C] hover:underline flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                Acessar
              </a>
            </div>

            <div className="p-4 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Paperclip className="w-5 h-5 text-[#8B5CF6]" />
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Roteiro & Decupagem de Cenas</h4>
                  <span className="text-[10px] text-[#6B7280]">PDF • 12 Páginas</span>
                </div>
              </div>
              <a href="#" className="text-xs font-bold text-[#2F6F9C] hover:underline flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                Acessar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB: HISTÓRICO & LOGS */}
      {activeTab === 'historico' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
          <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
            Histórico Cronológico do Projeto
          </h3>

          <div className="space-y-4 border-l-2 border-[#DDE3E8] pl-4 ml-2">
            {projectEvents.map(evt => (
              <div key={evt.id} className="relative text-xs space-y-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#66acd7] absolute -left-[21px] top-1" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111111]">{evt.actor}</span>
                  <span className="text-[10px] font-mono text-[#6B7280]">{evt.timeString}</span>
                </div>
                <p className="text-[#2F6F9C] font-semibold">{evt.action}</p>
                {evt.details && <p className="text-[#6B7280]">{evt.details}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        projectToEdit={project}
      />
    </div>
  );
};
