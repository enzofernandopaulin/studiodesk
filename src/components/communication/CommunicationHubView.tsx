import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Phone, 
  Mail, 
  Users, 
  Building2, 
  Clock, 
  Sparkles,
  CheckCheck
} from 'lucide-react';

export const CommunicationHubView: React.FC = () => {
  const { clients = [], communications = [], addCommunication, user } = useApp();
  const safeClients = clients || [];
  const safeComms = communications || [];
  const [selectedClientId, setSelectedClientId] = useState(safeClients[0]?.id || '');
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'interno'>('whatsapp');
  const [msgText, setMsgText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeClient = safeClients.find(c => c.id === selectedClientId) || safeClients[0];
  const clientMessages = safeComms.filter(c => c.clientId === activeClient?.id);

  const filteredClients = safeClients.filter(c => 
    (c.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeClient) return;

    if (addCommunication) {
      addCommunication({
        clientId: activeClient.id,
        channel,
        sender: user?.name || 'Usuário',
        content: msgText.trim(),
        status: 'enviado'
      });
    }
    setMsgText('');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="communication-view">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
          Central de Comunicação & Atendimento
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280]">
          Elimine conversas soltas: unifique histórico de WhatsApp, e-mails e alinhamentos de cada cliente em um único local.
        </p>
      </div>

      {/* 2-Column Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs overflow-hidden min-h-[600px]">
        {/* Left: Clients List (4 cols) */}
        <div className="lg:col-span-4 border-r border-[#DDE3E8] p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-8 pr-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Clients stream */}
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {filteredClients.map(c => {
                const isSelected = c.id === activeClient?.id;
                const lastMsg = communications.filter(comm => comm.clientId === c.id).slice(-1)[0];

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'hover:bg-[#F5F7F9] text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs truncate">{c.company}</h4>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-gray-300' : 'text-[#6B7280]'}`}>
                        {c.whatsapp ? 'WhatsApp' : 'E-mail'}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-[#6B7280]'}`}>
                      {lastMsg ? lastMsg.content : `${c.name} (${c.position})`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Message Stream & Send Bar (8 cols) */}
        <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-6">
          {activeClient ? (
            <>
              {/* Header Active Client */}
              <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-4">
                <div>
                  <h3 className="font-display text-lg font-black text-[#111111] uppercase tracking-tight">
                    {activeClient.company}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {activeClient.name} • {activeClient.whatsapp || activeClient.email}
                  </p>
                </div>

                <a
                  href={`https://wa.me/55${activeClient.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Abrir WhatsApp Web</span>
                </a>
              </div>

              {/* Messages Container */}
              <div className="flex-1 space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {clientMessages.map(msg => (
                  <div key={msg.id} className="p-4 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1.5 max-w-xl">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111111]">{msg.sender}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-white text-[#2F6F9C] border border-[#DDE3E8]">
                          {msg.channel}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#6B7280]">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#111111] leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="pt-4 border-t border-[#DDE3E8] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#111111]">Canal de Envio:</span>
                  <div className="flex gap-2">
                    {(['whatsapp', 'email', 'interno'] as const).map(ch => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannel(ch)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                          channel === ch ? 'bg-[#111111] text-white' : 'bg-gray-100 text-[#6B7280]'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder={`Registrar mensagem ou enviar via ${channel}...`}
                    className="flex-1 px-4 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                  />
                  <button
                    type="submit"
                    className="bg-[#2F6F9C] hover:bg-[#111111] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Registrar</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-8 text-center text-[#6B7280] text-xs">
              Selecione um cliente ao lado para ver o histórico de comunicação.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
