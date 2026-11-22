import React, { useState } from 'react';
import { MessageSquare, Search, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InternalWorkspaceChat } from './InternalWorkspaceChat';

const ContextualCommunicationPanel: React.FC = () => {
  const { clients = [], communications = [], addCommunication, user } = useApp();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'interno'>('whatsapp');
  const [msgText, setMsgText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const activeClient = clients.find(client => client.id === selectedClientId) || clients[0];
  const clientMessages = communications.filter(communication => communication.clientId === activeClient?.id);
  const filteredClients = clients.filter(client => `${client.company} ${client.name}`.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!msgText.trim() || !activeClient) return;
    void addCommunication({ clientId: activeClient.id, channel, sender: user?.name || 'Usuário', content: msgText.trim(), status: 'enviado' });
    setMsgText('');
  };

  return <div className="mx-auto max-w-7xl p-4 sm:p-8"><div className="grid min-h-[600px] grid-cols-1 overflow-hidden rounded-3xl border border-[#DDE3E8] bg-white shadow-2xs lg:grid-cols-12"><div className="space-y-4 border-b border-[#DDE3E8] p-4 lg:col-span-4 lg:border-b-0 lg:border-r"><div className="relative"><Search className="absolute left-3 top-3 h-3.5 w-3.5 text-[#6B7280]" /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Buscar cliente..." className="w-full rounded-xl border border-[#DDE3E8] bg-[#F5F7F9] py-2 pl-8 pr-3 text-xs outline-none focus:bg-white" /></div><div className="max-h-[500px] space-y-1 overflow-y-auto">{filteredClients.map(client => { const selected = client.id === activeClient?.id; const last = communications.filter(item => item.clientId === client.id).slice(-1)[0]; return <button key={client.id} onClick={() => setSelectedClientId(client.id)} className={`w-full rounded-2xl p-3 text-left ${selected ? 'bg-[#111111] text-white' : 'text-[#111111] hover:bg-[#F5F7F9]'}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold">{client.company}</span><span className="text-[10px] opacity-70">{client.whatsapp ? 'WhatsApp' : 'E-mail'}</span></div><p className="mt-0.5 truncate text-[11px] opacity-70">{last?.content || client.name}</p></button>; })}</div></div><div className="flex flex-col space-y-5 p-5 lg:col-span-8 sm:p-6">{activeClient ? <><div className="flex items-center justify-between border-b border-[#DDE3E8] pb-4"><div><h3 className="font-display text-lg font-black uppercase tracking-tight text-[#111111]">{activeClient.company}</h3><p className="text-xs text-[#6B7280]">{activeClient.name} · {activeClient.whatsapp || activeClient.email}</p></div>{activeClient.whatsapp && <a href={`https://wa.me/55${activeClient.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Abrir WhatsApp Web</a>}</div><div className="flex-1 space-y-4 overflow-y-auto pr-2">{clientMessages.map(message => <div key={message.id} className="max-w-xl space-y-1.5 rounded-2xl border border-[#DDE3E8] bg-[#F5F7F9] p-4"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-bold text-[#111111]">{message.sender}</span><span className="text-[10px] text-[#6B7280]">{message.timestamp}</span></div><p className="whitespace-pre-line text-xs leading-relaxed text-[#111111]">{message.content}</p></div>)}</div><form onSubmit={handleSend} className="space-y-3 border-t border-[#DDE3E8] pt-4"><div className="flex items-center gap-2"><span className="text-xs font-bold text-[#111111]">Canal:</span>{(['whatsapp', 'email', 'interno'] as const).map(option => <button key={option} type="button" onClick={() => setChannel(option)} className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${channel === option ? 'bg-[#111111] text-white' : 'bg-gray-100 text-[#6B7280]'}`}>{option}</button>)}</div><div className="flex gap-2"><input value={msgText} onChange={event => setMsgText(event.target.value)} placeholder={`Registrar mensagem via ${channel}...`} className="min-w-0 flex-1 rounded-xl border border-[#DDE3E8] bg-[#F5F7F9] px-4 py-2.5 text-xs outline-none focus:bg-white" /><button type="submit" className="flex items-center gap-1.5 rounded-xl bg-[#2F6F9C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#111111]"><Send className="h-3.5 w-3.5" /> Registrar</button></div></form></> : <div className="flex flex-1 items-center justify-center text-sm text-[#6B7280]">Selecione um cliente ao lado para ver o histórico.</div>}</div></div></div>;
};

export const CommunicationHubView: React.FC = () => {
  const [tab, setTab] = useState<'chat' | 'contextual'>('chat');
  return <div><div className="mx-auto flex max-w-6xl gap-2 px-4 pt-4 sm:px-8 sm:pt-8"><button onClick={() => setTab('chat')} className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${tab === 'chat' ? 'bg-[#111111] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F5F7F9]'}`}><MessageSquare className="mr-2 inline h-3.5 w-3.5" />Chat interno</button><button onClick={() => setTab('contextual')} className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${tab === 'contextual' ? 'bg-[#111111] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F5F7F9]'}`}>Comunicação contextual</button></div>{tab === 'chat' ? <InternalWorkspaceChat /> : <ContextualCommunicationPanel />}</div>;
};
