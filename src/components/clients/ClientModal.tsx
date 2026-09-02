import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus } from '../../types';
import { X, UserPlus, Building2, Mail, Phone, MessageSquare, Globe, Briefcase, Tag, FileText } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, clientToEdit }) => {
  const { addClient, updateClient, user, team } = useApp();

  const [name, setName] = useState(clientToEdit?.name || '');
  const [company, setCompany] = useState(clientToEdit?.company || '');
  const [email, setEmail] = useState(clientToEdit?.email || '');
  const [phone, setPhone] = useState(clientToEdit?.phone || '');
  const [whatsapp, setWhatsapp] = useState(clientToEdit?.whatsapp || '');
  const [website, setWebsite] = useState(clientToEdit?.website || '');
  const [position, setPosition] = useState(clientToEdit?.position || 'Diretor Executivo');
  const [segment, setSegment] = useState(clientToEdit?.segment || 'Marketing & Audiovisual');
  const [assignedTo, setAssignedTo] = useState(clientToEdit?.assignedTo || user.name);
  const [status, setStatus] = useState<ClientStatus>(clientToEdit?.status || 'ativo');
  const [notes, setNotes] = useState(clientToEdit?.notes || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(clientToEdit?.tags || ['Audiovisual', 'Recorrente']);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        name,
        company,
        email,
        phone,
        whatsapp,
        website,
        position,
        segment,
        assignedTo,
        status,
        notes,
        tags
      });
    } else {
      addClient({
        name,
        company,
        email,
        phone,
        whatsapp,
        website,
        position,
        segment,
        assignedTo,
        status,
        notes,
        tags
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl p-6 space-y-5 overflow-y-auto max-h-[90vh]" id="client-modal">
        <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#2F6F9C]" />
            <h3 className="font-display text-xl font-black text-[#111111] uppercase tracking-tight">
              {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#6B7280] hover:text-[#111111]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Nome do Contato Principal *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Gabriel Silva"
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Nome da Empresa *</label>
              <input
                type="text"
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Ex: Agência Horizonte"
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="gabriel@empresa.com.br"
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">WhatsApp de Contato</label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => {
                    setWhatsapp(e.target.value);
                    setPhone(e.target.value);
                  }}
                  placeholder="(13) 99744-1020"
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Website / Link</label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Cargo / Posição</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="Ex: Diretor Executivo"
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Segmento</label>
              <input
                type="text"
                value={segment}
                onChange={e => setSegment(e.target.value)}
                placeholder="Ex: Audiovisual"
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Responsável Interno</label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                <option value={user.name}>{user.name} (Você)</option>
                {team.map(tm => (
                  <option key={tm.id} value={tm.name}>{tm.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Status da Conta</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ClientStatus)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                <option value="ativo">Ativo (Com projetos ou recorrente)</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">Tags & Segmentação</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Ex: VIP, Recorrente, Institucional (Pressione Enter)"
                className="flex-1 px-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-xl"
              >
                Adicionar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span
                  key={t}
                  className="bg-[#66acd7]/15 text-[#2F6F9C] border border-[#66acd7]/30 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">Informações Adicionais / Observações</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Preferências de contato, formato de entregas, histórico de relacionamento..."
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
              {clientToEdit ? 'Salvar Alterações' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
