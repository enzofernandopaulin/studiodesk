import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus } from '../../types';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  MessageSquare, 
  FolderKanban, 
  Trash2, 
  Edit, 
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react';
import { ClientModal } from './ClientModal';
import { EmptyState } from '../common/EmptyState';

export const ClientsView: React.FC = () => {
  const { clients, deleteClient, setSelectedClientId, setCurrentView, projects } = useApp();
  const [activeFilter, setActiveFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesFilter = activeFilter === 'todos' || c.status === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.segment.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [clients, activeFilter, searchQuery]);

  const handleOpenClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentView('client_profile');
  };

  const handleOpenEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    deleteClient(clientId);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="clients-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
            Carteira de Clientes
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Controle unificado de histórico, projetos, contatos e comunicação.
          </p>
        </div>

        <button
          onClick={() => {
            setClientToEdit(null);
            setIsModalOpen(true);
          }}
          className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
          id="btn-new-client"
        >
          <Plus className="w-4 h-4 text-[#66acd7]" />
          <span>+ Novo cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#DDE3E8] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'todos' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setActiveFilter('ativo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'ativo' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Ativos ({clients.filter(c => c.status === 'ativo').length})
          </button>
          <button
            onClick={() => setActiveFilter('inativo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'inativo' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
            }`}
          >
            Inativos ({clients.filter(c => c.status === 'inativo').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, empresa ou tag..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description={
            clients.length === 0
              ? "Comece cadastrando seu primeiro cliente ou convertendo leads do formulário do site."
              : "Nenhum cliente corresponde ao filtro de busca."
          }
          actionLabel="+ Novo cliente"
          onAction={() => {
            setClientToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => {
            const clientProjs = projects.filter(p => p.clientId === client.id);
            return (
              <div
                key={client.id}
                onClick={() => handleOpenClient(client.id)}
                className="p-5 bg-white rounded-2xl border border-[#DDE3E8] hover:border-[#2F6F9C] transition-all cursor-pointer shadow-2xs flex flex-col justify-between space-y-4 group"
                id={`client-card-${client.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#66acd7]/20 text-[#2F6F9C] flex items-center justify-center font-display font-black text-lg">
                        {client.company.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#111111] group-hover:text-[#2F6F9C] transition-colors">
                          {client.company}
                        </h3>
                        <p className="text-xs text-[#6B7280]">{client.name} • {client.position}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      client.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {client.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#6B7280] pt-1">
                    <div className="flex items-center gap-2 text-[#111111]">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{client.whatsapp || client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {client.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] font-semibold bg-[#F5F7F9] text-[#111111] px-2 py-0.5 rounded border border-[#DDE3E8]">
                        {t}
                      </span>
                    ))}
                    {client.tags.length > 3 && (
                      <span className="text-[10px] text-[#6B7280]">+{client.tags.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Footer with Project count and actions */}
                <div className="pt-3 border-t border-[#DDE3E8] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2F6F9C]">
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>{clientProjs.length} {clientProjs.length === 1 ? 'projeto' : 'projetos'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(e, client)}
                      className="p-1.5 text-[#6B7280] hover:text-[#111111] rounded-lg hover:bg-[#F5F7F9]"
                      title="Editar cliente"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, client.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-6 h-6 rounded-lg bg-[#F5F7F9] group-hover:bg-[#2F6F9C] group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={clientToEdit}
      />
    </div>
  );
};
