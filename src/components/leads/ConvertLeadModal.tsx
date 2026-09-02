import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead } from '../../types';
import { X, CheckCircle2, UserCheck, FolderPlus, ArrowRight } from 'lucide-react';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({ isOpen, onClose, lead }) => {
  const { convertLeadToClient, setSelectedClientId, setSelectedProjectId, setCurrentView } = useApp();
  const [createProject, setCreateProject] = useState(true);
  const [projectTitle, setProjectTitle] = useState(
    lead ? `Projeto Inicial — ${lead.company}` : 'Projeto Inicial'
  );

  if (!isOpen || !lead) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    const result = convertLeadToClient(lead.id, createProject, projectTitle);
    setSelectedClientId(result.client.id);
    if (result.project) {
      setSelectedProjectId(result.project.id);
    }
    onClose();
    setCurrentView(createProject ? 'kanban' : 'clients');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl p-6 space-y-5" id="convert-lead-modal">
        <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display text-xl font-black text-[#111111] uppercase tracking-tight">
              Converter Lead em Cliente
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#6B7280] hover:text-[#111111]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConvert} className="space-y-4">
          <div className="p-3.5 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Lead a Ser Convertido:
            </span>
            <p className="text-sm font-bold text-[#111111]">{lead.name}</p>
            <p className="text-xs text-[#2F6F9C] font-semibold">{lead.company} • {lead.serviceInterest}</p>
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed">
            Ao converter este lead, ele será promovido para a carteira oficial de <strong>Clientes Ativos</strong>, abrindo histórico completo de comunicação, atividades e projetos.
          </p>

          {/* Option to create first project */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-[#66acd7]/40 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={createProject}
                onChange={e => setCreateProject(e.target.checked)}
                className="w-4 h-4 rounded text-[#2F6F9C] focus:ring-[#66acd7]"
              />
              <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#2F6F9C]" />
                Criar primeiro projeto automaticamente no Kanban
              </span>
            </label>

            {createProject && (
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Título do Projeto Inicial</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#66acd7]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDE3E8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111111]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Conversão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
