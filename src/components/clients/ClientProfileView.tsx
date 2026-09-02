import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MessageSquare, 
  Calendar, 
  Clock, 
  FolderKanban, 
  Plus, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Send, 
  Tag, 
  FileText, 
  Activity,
  Briefcase
} from 'lucide-react';
import { ClientModal } from './ClientModal';

interface ClientProfileViewProps {
  onOpenNewProjectForClient?: (clientId: string) => void;
}

export const ClientProfileView: React.FC<ClientProfileViewProps> = ({ onOpenNewProjectForClient }) => {
  const { 
    clients = [], 
    selectedClientId, 
    setSelectedClientId, 
    setCurrentView, 
    projects = [], 
    setSelectedProjectId, 
    updateClient, 
    deleteClient,
    communications = [],
    addCommunication,
    timelineEvents = [],
    user
  } = useApp();

  const [activeTab, setActiveTab] = useState<'geral' | 'projetos' | 'atividades' | 'notas' | 'comunicacao'>('geral');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [msgChannel, setMsgChannel] = useState<'whatsapp' | 'email' | 'interno'>('whatsapp');

  const safeClients = clients || [];
  const client = safeClients.find(c => c.id === selectedClientId) || safeClients[0];

  if (!client) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-[#6B7280]">Cliente não encontrado.</p>
        <button
          onClick={() => setCurrentView('clients')}
          className="text-xs font-bold text-[#2F6F9C] hover:underline"
        >
          ← Voltar para lista de clientes
        </button>
      </div>
    );
  }

  const safeProjects = projects || [];
  const safeComms = communications || [];
  const safeEvents = timelineEvents || [];

  const clientProjects = safeProjects.filter(p => p.clientId === client.id);
  const clientCommunications = safeComms.filter(c => c.clientId === client.id);
  const clientEvents = safeEvents.filter(e => e.referenceId === client.id || (e as any).entityId === client.id || clientProjects.some(p => p.id === e.referenceId || p.id === (e as any).entityId));

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateClient) {
      updateClient(client.id, { notes: noteContent });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    if (addCommunication) {
      addCommunication({
        clientId: client.id,
        channel: msgChannel,
        sender: user?.name || 'Usuário',
        content: msgInput.trim(),
        status: 'enviado'
      });
    }
    setMsgInput('');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="client-profile-view">
      {/* Back button */}
      <button
        onClick={() => setCurrentView('clients')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#111111] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Clientes</span>
      </button>

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-[#DDE3E8] p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#66acd7]/20 text-[#2F6F9C] flex items-center justify-center font-display font-black text-2xl uppercase shrink-0">
              {client.company.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
                  {client.company}
                </h1>
                <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  client.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {client.status === 'ativo' ? '● Cliente Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1 flex items-center gap-2 flex-wrap">
                <span>Contato Principal: <strong>{client.name}</strong> ({client.position})</span>
                <span>•</span>
                <span>Segmento: <strong>{client.segment}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Direto</span>
            </a>

            <button
              onClick={() => {
                if (onOpenNewProjectForClient) {
                  onOpenNewProjectForClient(client.id);
                } else {
                  setCurrentView('projects');
                }
              }}
              className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#66acd7]" />
              <span>+ Novo Projeto</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 bg-[#F5F7F9] hover:bg-gray-200 text-[#111111] rounded-xl transition-colors"
              title="Editar dados do cliente"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#DDE3E8] pt-2 overflow-x-auto">
          {[
            { id: 'geral', label: 'Visão Geral' },
            { id: 'projetos', label: `Projetos (${clientProjects.length})` },
            { id: 'comunicacao', label: `Comunicação (${clientCommunications.length})` },
            { id: 'atividades', label: 'Histórico & Timeline' },
            { id: 'notas', label: 'Anotações & Preferências' },
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

      {/* TAB CONTENT: VISÃO GERAL */}
      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Contact Details & Info */}
          <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
            <h3 className="font-display text-sm font-black text-[#111111] uppercase tracking-tight">
              Dados Cadastrais & Contato
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#111111]">
                <Mail className="w-4 h-4 text-[#6B7280] shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#111111]">
                <Phone className="w-4 h-4 text-[#6B7280] shrink-0" />
                <span>{client.phone || client.whatsapp}</span>
              </div>
              {client.website && (
                <div className="flex items-center gap-2 text-[#2F6F9C]">
                  <Globe className="w-4 h-4 text-[#6B7280] shrink-0" />
                  <a href={client.website} target="_blank" rel="noreferrer" className="truncate hover:underline">
                    {client.website}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#6B7280]">
                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Responsável: <strong>{client.assignedTo}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDE3E8]">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase block mb-1.5">Tags</span>
              <div className="flex flex-wrap gap-1">
                {client.tags.map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-[#F5F7F9] text-[#111111] px-2 py-0.5 rounded border border-[#DDE3E8]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {client.notes && (
              <div className="pt-3 border-t border-[#DDE3E8]">
                <span className="text-[11px] font-bold text-[#6B7280] uppercase block mb-1">Notas Rápidas</span>
                <p className="text-xs text-[#6B7280] italic bg-[#F5F7F9] p-2.5 rounded-xl border border-[#DDE3E8]">
                  "{client.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Col 2 & 3: Projetos Ativos & Próximos Prazos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-[#111111] uppercase tracking-tight">
                  Projetos Vinculados ({clientProjects.length})
                </h3>
                <button
                  onClick={() => {
                    if (onOpenNewProjectForClient) onOpenNewProjectForClient(client.id);
                    else setCurrentView('projects');
                  }}
                  className="text-xs font-bold text-[#2F6F9C] hover:underline"
                >
                  + Novo Projeto
                </button>
              </div>

              {clientProjects.length === 0 ? (
                <p className="text-xs text-[#6B7280] py-4 text-center">Nenhum projeto cadastrado para este cliente.</p>
              ) : (
                <div className="space-y-2">
                  {clientProjects.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setCurrentView('project_detail');
                      }}
                      className="p-3.5 bg-[#F5F7F9] hover:bg-blue-50/40 rounded-xl border border-[#DDE3E8] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#111111]">{proj.title}</h4>
                        <p className="text-[11px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                          <span>Prazo: {new Date(proj.deadline).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>Responsável: {proj.assignedTo.split(' ')[0]}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-white text-[#2F6F9C] border border-[#DDE3E8]">
                        {proj.columnId.replace('col_', '').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Últimas Comunicações */}
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-black text-[#111111] uppercase tracking-tight">
                  Últimas Comunicações
                </h3>
                <button
                  onClick={() => setActiveTab('comunicacao')}
                  className="text-xs font-bold text-[#2F6F9C] hover:underline"
                >
                  Ver todas
                </button>
              </div>

              {clientCommunications.length === 0 ? (
                <p className="text-xs text-[#6B7280] py-2 text-center">Nenhuma mensagem registrada.</p>
              ) : (
                <div className="space-y-2">
                  {clientCommunications.slice(0, 3).map(comm => (
                    <div key={comm.id} className="p-3 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#111111]">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          {comm.sender}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B7280]">{comm.timestamp}</span>
                      </div>
                      <p className="text-[#6B7280] mt-1 text-[11px]">{comm.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROJETOS */}
      {activeTab === 'projetos' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
              Todos os Projetos de {client.company}
            </h3>
            <button
              onClick={() => {
                if (onOpenNewProjectForClient) onOpenNewProjectForClient(client.id);
                else setCurrentView('projects');
              }}
              className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#66acd7]" />
              Novo Projeto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientProjects.map(proj => (
              <div
                key={proj.id}
                onClick={() => {
                  setSelectedProjectId(proj.id);
                  setCurrentView('project_detail');
                }}
                className="p-4 bg-[#F5F7F9] hover:bg-blue-50/30 rounded-2xl border border-[#DDE3E8] cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-sm text-[#111111]">{proj.title}</h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white text-[#2F6F9C] border border-[#DDE3E8]">
                    {proj.priority}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] line-clamp-2">{proj.description}</p>
                <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-[#DDE3E8]">
                  <span>Prazo: {new Date(proj.deadline).toLocaleDateString('pt-BR')}</span>
                  <span className="font-bold text-[#111111]">R$ {proj.budget.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMUNICAÇÃO */}
      {activeTab === 'comunicacao' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-6">
          <div>
            <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
              Histórico de Comunicação Centralizada
            </h3>
            <p className="text-xs text-[#6B7280]">
              Registre contatos do WhatsApp, e-mails e alinhamentos de briefing para manter a equipe informada.
            </p>
          </div>

          {/* Form to log communication */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111111]">Canal:</span>
              <div className="flex gap-2">
                {(['whatsapp', 'email', 'interno'] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setMsgChannel(ch)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                      msgChannel === ch ? 'bg-[#111111] text-white' : 'bg-white text-[#6B7280] border border-[#DDE3E8]'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              placeholder="Digite o registro da mensagem, áudio transcrito ou alinhamento com o cliente..."
              className="w-full p-3 bg-white border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#66acd7]"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#2F6F9C] hover:bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Registrar Comunicação
              </button>
            </div>
          </form>

          {/* Communications Feed */}
          <div className="space-y-3">
            {clientCommunications.map(comm => (
              <div key={comm.id} className="p-4 bg-white rounded-2xl border border-[#DDE3E8] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111]">{comm.sender}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-blue-50 text-[#2F6F9C] border border-blue-100">
                      {comm.channel}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280]">{comm.timestamp}</span>
                </div>
                <p className="text-xs text-[#6B7280] whitespace-pre-line">{comm.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ATIVIDADES & TIMELINE */}
      {activeTab === 'atividades' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
          <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
            Timeline de Ações & Rastreabilidade
          </h3>

          <div className="space-y-4 border-l-2 border-[#DDE3E8] pl-4 ml-2">
            {clientEvents.map(evt => (
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

      {/* TAB CONTENT: NOTAS */}
      {activeTab === 'notas' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
          <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
            Anotações & Preferências da Conta
          </h3>

          <textarea
            rows={8}
            defaultValue={client.notes}
            onBlur={e => updateClient(client.id, { notes: e.target.value })}
            placeholder="Escreva aqui todas as particularidades deste cliente (ex: prefere receber vídeos pelo Drive, contato no WhatsApp apenas de manhã, identidade visual com paleta azul, etc.)..."
            className="w-full p-4 bg-[#F5F7F9] border border-[#DDE3E8] rounded-2xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7] leading-relaxed"
          />
          <p className="text-[11px] text-[#6B7280]">
            As alterações são salvas automaticamente ao clicar fora do campo de texto.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        clientToEdit={client}
      />
    </div>
  );
};
