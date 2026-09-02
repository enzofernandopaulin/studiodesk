import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus } from '../../types';
import { X, Sparkles, User, Building2, Mail, Phone, MessageSquare, Briefcase, FileText } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, leadToEdit }) => {
  const { addLead, updateLead, user, team } = useApp();

  const [name, setName] = useState(leadToEdit?.name || '');
  const [company, setCompany] = useState(leadToEdit?.company || '');
  const [email, setEmail] = useState(leadToEdit?.email || '');
  const [phone, setPhone] = useState(leadToEdit?.phone || '');
  const [whatsapp, setWhatsapp] = useState(leadToEdit?.whatsapp || '');
  const [source, setSource] = useState<Lead['source']>(leadToEdit?.source || 'Site Institucional');
  const [serviceInterest, setServiceInterest] = useState(leadToEdit?.serviceInterest || 'Vídeo Institucional & Produção');
  const [assignedTo, setAssignedTo] = useState(leadToEdit?.assignedTo || user.name);
  const [notes, setNotes] = useState(leadToEdit?.notes || '');
  const [status, setStatus] = useState<LeadStatus>(leadToEdit?.status || 'novo');
  const [value, setValue] = useState(leadToEdit?.value?.toString() || '7500');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadToEdit) {
      updateLead(leadToEdit.id, {
        name,
        company,
        email,
        phone,
        whatsapp,
        source,
        serviceInterest,
        assignedTo,
        notes,
        status,
        value: Number(value) || 0
      });
    } else {
      addLead({
        name,
        company,
        email,
        phone,
        whatsapp,
        source,
        serviceInterest,
        assignedTo,
        notes,
        status,
        value: Number(value) || 0
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl p-6 space-y-5 overflow-y-auto max-h-[90vh]" id="lead-modal">
        <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            <h3 className="font-display text-xl font-black text-[#111111] uppercase tracking-tight">
              {leadToEdit ? 'Editar Lead' : 'Novo Lead Comercial'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#6B7280] hover:text-[#111111]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Nome do Contato *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Empresa / Negócio *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Ex: Restaurante Terraço"
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">WhatsApp / Telefone</label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => {
                    setWhatsapp(e.target.value);
                    setPhone(e.target.value);
                  }}
                  placeholder="(13) 99872-4411"
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Origem do Lead</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as Lead['source'])}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                <option value="Site Institucional">Site Institucional (Formulário)</option>
                <option value="Instagram">Instagram</option>
                <option value="WhatsApp Direto">WhatsApp Direto</option>
                <option value="Indicação">Indicação</option>
                <option value="Google">Google / Tráfego</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Responsável Comercial</label>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Serviço de Interesse</label>
              <input
                type="text"
                value={serviceInterest}
                onChange={e => setServiceInterest(e.target.value)}
                placeholder="Ex: Vídeo 4K Institucional + 8 Reels"
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Status no Funil</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              >
                <option value="novo">Novo</option>
                <option value="em_contato">Em Contato</option>
                <option value="qualificado">Qualificado</option>
                <option value="proposta">Proposta</option>
                <option value="convertido">Convertido</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">Observações & Anotações</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Histórico da conversa, briefing preliminar ou detalhes do contato..."
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
              {leadToEdit ? 'Salvar Alterações' : 'Salvar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
