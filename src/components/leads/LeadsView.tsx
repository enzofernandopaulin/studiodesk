import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus } from '../../types';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MessageSquare, 
  UserCheck, 
  Globe, 
  Trash2, 
  Edit, 
  Calendar,
  Building2,
  Tag,
  ArrowRight,
  Check
} from 'lucide-react';
import { LeadModal } from './LeadModal';
import { ConvertLeadModal } from './ConvertLeadModal';
import { EmptyState } from '../common/EmptyState';

export const LeadsView: React.FC = () => {
  const { leads, deleteLead } = useApp();
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'novo', label: 'Novos' },
    { id: 'em_contato', label: 'Em Contato' },
    { id: 'qualificado', label: 'Qualificados' },
    { id: 'proposta', label: 'Proposta' },
    { id: 'convertido', label: 'Convertidos' },
    { id: 'perdido', label: 'Perdidos' },
  ];

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesFilter = activeFilter === 'todos' || lead.status === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.serviceInterest.toLowerCase().includes(q) ||
        lead.source.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [leads, activeFilter, searchQuery]);

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'novo':
        return <span className="bg-blue-100 text-[#2F6F9C] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Novo</span>;
      case 'em_contato':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Em Contato</span>;
      case 'qualificado':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Qualificado</span>;
      case 'proposta':
        return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Proposta</span>;
      case 'convertido':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">✓ Convertido</span>;
      case 'perdido':
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Perdido</span>;
    }
  };

  const handleOpenEdit = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsModalOpen(true);
  };

  const handleOpenConvert = (lead: Lead) => {
    setLeadToConvert(lead);
    setIsConvertModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="leads-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
            Funil de Leads & Oportunidades
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Captação integrada da página institucional e canais de contato.
          </p>
        </div>

        <button
          onClick={() => {
            setLeadToEdit(null);
            setIsModalOpen(true);
          }}
          className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
          id="btn-new-lead"
        >
          <Plus className="w-4 h-4 text-[#66acd7]" />
          <span>+ Novo lead</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#DDE3E8] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? 'bg-[#111111] text-white'
                  : 'text-[#6B7280] hover:bg-[#F5F7F9] hover:text-[#111111]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filtrar leads..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
          />
        </div>
      </div>

      {/* Leads List / Cards */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nenhum lead encontrado"
          description={
            leads.length === 0 
              ? "Comece cadastrando uma oportunidade comercial ou receba leads do formulário do site."
              : "Nenhum lead corresponde ao filtro selecionado."
          }
          actionLabel="+ Novo lead"
          onAction={() => {
            setLeadToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <div
              key={lead.id}
              className="p-5 bg-white rounded-2xl border border-[#DDE3E8] hover:border-[#66acd7] transition-all shadow-2xs flex flex-col justify-between space-y-4 group"
              id={`lead-card-${lead.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#111111]">{lead.name}</h3>
                    <p className="text-xs text-[#6B7280] font-medium flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-[#2F6F9C]" />
                      {lead.company}
                    </p>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>

                <div className="p-2.5 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span className="font-bold text-[#111111]">Interesse:</span>
                    <span className="font-semibold text-[#8B5CF6]">{lead.source}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#2F6F9C]">{lead.serviceInterest}</p>
                </div>

                {lead.notes && (
                  <p className="text-[11px] text-[#6B7280] line-clamp-2 italic">
                    "{lead.notes}"
                  </p>
                )}

                <div className="space-y-1 text-xs text-[#6B7280] pt-1">
                  {lead.whatsapp && (
                    <div className="flex items-center gap-2 text-[#111111]">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lead.whatsapp}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#DDE3E8]/60">
                    <span>Responsável: <strong>{lead.assignedTo.split(' ')[0]}</strong></span>
                    <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#DDE3E8] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(lead)}
                    className="p-1.5 text-[#6B7280] hover:text-[#111111] rounded-lg hover:bg-[#F5F7F9]"
                    title="Editar lead"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                    title="Excluir lead"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {lead.status !== 'convertido' ? (
                  <button
                    onClick={() => handleOpenConvert(lead)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Converter em cliente</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Já na Carteira
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadToEdit={leadToEdit}
      />

      <ConvertLeadModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={leadToConvert}
      />
    </div>
  );
};
