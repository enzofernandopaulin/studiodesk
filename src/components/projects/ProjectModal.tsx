import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, PriorityLevel } from '../../types';
import { X, FolderPlus, Building2, User, Calendar, DollarSign, Tag, ListChecks } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
  defaultClientId?: string;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  projectToEdit, 
  defaultClientId 
}) => {
  const { addProject, updateProject, clients, user, team, kanbanColumns } = useApp();

  const [title, setTitle] = useState(projectToEdit?.title || '');
  const [clientId, setClientId] = useState(projectToEdit?.clientId || defaultClientId || (clients[0]?.id || ''));
  const [columnId, setColumnId] = useState(projectToEdit?.columnId || kanbanColumns[0]?.id || 'col_briefing');
  const [assignedTo, setAssignedTo] = useState(projectToEdit?.assignedTo || user.name);
  const [priority, setPriority] = useState<PriorityLevel>(projectToEdit?.priority || 'alta');
  const [deadline, setDeadline] = useState(projectToEdit?.deadline || '2025-05-15');
  const [budget, setBudget] = useState(projectToEdit?.budget?.toString() || '6500');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [tags, setTags] = useState<string[]>(projectToEdit?.tags || ['Vídeo 4K', 'Institucional']);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === clientId);
    const clientName = selectedClient ? selectedClient.company : 'Cliente';

    if (projectToEdit) {
      updateProject(projectToEdit.id, {
        title,
        clientId,
        clientName,
        columnId,
        assignedTo,
        priority,
        deadline,
        budget: Number(budget) || 0,
        description,
        tags
      });
    } else {
      addProject({
        title,
        clientId,
        clientName,
        columnId,
        assignedTo,
        priority,
        deadline,
        budget: Number(budget) || 0,
        description,
        tags
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl p-6 space-y-5 overflow-y-auto max-h-[90vh]" id="project-modal">
        <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-[#2F6F9C]" />
            <h3 className="font-display text-xl font-black text-[#111111] uppercase tracking-tight">
              {projectToEdit ? 'Editar Projeto' : 'Novo Projeto no Kanban'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#6B7280] hover:text-[#111111]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">Título do Projeto *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Vídeo Institucional 4K — Campanha de Inverno"
              className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Cliente Vinculado *</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Etapa Inicial no Kanban</label>
              <select
                value={columnId}
                onChange={e => setColumnId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                {kanbanColumns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Responsável</label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                <option value={user.name}>{user.name} (Você)</option>
                {team.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Prazo de Entrega</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">Valor / Orçamento do Projeto (R$)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="6500"
                className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">Descrição / Escopo do Projeto</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva as entregas acordadas, locações, equipamentos e cronograma..."
              className="w-full p-3 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDE3E8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111111]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              {projectToEdit ? 'Salvar Alterações' : 'Criar Projeto no Kanban'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
