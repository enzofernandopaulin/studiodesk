import React, { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, LogOut, MessageCircle, Send, Video, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export const ClientPortalView: React.FC = () => {
  const { user, projects, approvalRequests, messages, signOut, addToast } = useApp();
  const [message, setMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const clientProjects = useMemo(() => projects.filter(project => !user.clientId || project.clientId === user.clientId), [projects, user.clientId]);
  const clientApprovals = useMemo(() => approvalRequests.filter(item => !user.clientId || item.clientId === user.clientId), [approvalRequests, user.clientId]);
  const project = clientProjects.find(item => item.id === selectedProjectId) || clientProjects[0];
  const projectMessages = messages.filter(item => item.projectId === project?.id);

  const send = async () => {
    if (!supabase || !project || !message.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('client_send_message', { p_project_id: project.id, p_content: message.trim() });
      if (error) throw error;
      setMessage('');
      addToast('success', 'Mensagem enviada', 'A equipe da agência foi notificada.');
    } catch (error) {
      addToast('error', 'Mensagem não enviada', error instanceof Error ? error.message : 'Tente novamente.');
    } finally { setBusy(false); }
  };

  const respond = async (id: string, status: 'approved' | 'rejected' | 'needs_revision') => {
    if (!supabase) return;
    const feedback = status === 'approved' ? '' : window.prompt(status === 'rejected' ? 'Informe o motivo da reprovação:' : 'Descreva os ajustes necessários:') || '';
    if (status !== 'approved' && !feedback.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('client_respond_to_approval', { p_approval_id: id, p_status: status, p_feedback: feedback });
      if (error) throw error;
      addToast('success', 'Resposta registrada', 'A equipe verá sua decisão na área de aprovações.');
    } catch (error) {
      addToast('error', 'Não foi possível responder', error instanceof Error ? error.message : 'Tente novamente.');
    } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-[#F5F7F9] px-4 py-6 sm:px-8">
    <header className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl border border-[#DDE3E8] bg-white px-5 py-4 shadow-sm">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6F9C]">Portal do cliente</p><h1 className="text-xl font-black text-[#111111]">Olá, {user.name || 'cliente'}</h1><p className="text-xs text-[#6B7280]">Acompanhe seus projetos e fale com a equipe.</p></div>
      <button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl border border-[#DDE3E8] px-3 py-2 text-xs font-bold text-[#4B5563]"><LogOut className="h-4 w-4" />Sair</button>
    </header>

    <main className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-3xl border border-[#DDE3E8] bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2 text-sm font-black"><ClipboardList className="h-4 w-4 text-[#2F6F9C]" />Meus projetos</div>{clientProjects.length === 0 ? <p className="rounded-2xl bg-[#F5F7F9] p-4 text-xs text-[#6B7280]">Nenhum projeto foi vinculado à sua conta.</p> : <div className="space-y-2">{clientProjects.map(item => <button key={item.id} onClick={() => setSelectedProjectId(item.id)} className={`w-full rounded-2xl p-3 text-left ${project?.id === item.id ? 'bg-[#111111] text-white' : 'border border-[#DDE3E8] text-[#111111]'}`}><p className="text-sm font-bold">{item.title}</p><p className={`mt-1 text-[11px] ${project?.id === item.id ? 'text-white/70' : 'text-[#6B7280]'}`}>{item.progress}% concluído</p></button>)}</div>}</aside>

      <section className="space-y-6">
        {project ? <div className="rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#2F6F9C]">Meu projeto</p><h2 className="mt-1 text-2xl font-black">{project.title}</h2><p className="mt-2 max-w-2xl text-sm text-[#6B7280]">{project.description || 'A equipe ainda não adicionou uma descrição.'}</p></div><span className="rounded-full bg-[#E8F4FA] px-3 py-1 text-xs font-bold text-[#2F6F9C]">{project.progress}% concluído</span></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-[#E8EEF2]"><div className="h-full rounded-full bg-[#66acd7]" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#F5F7F9] p-4"><p className="text-[11px] font-bold uppercase text-[#6B7280]">Etapa atual</p><p className="mt-1 text-sm font-black">{project.status || 'Em andamento'}</p></div><div className="rounded-2xl bg-[#F5F7F9] p-4"><p className="text-[11px] font-bold uppercase text-[#6B7280]">Prazo</p><p className="mt-1 text-sm font-black">{project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'A definir'}</p></div><div className="rounded-2xl bg-[#F5F7F9] p-4"><p className="text-[11px] font-bold uppercase text-[#6B7280]">Responsável</p><p className="mt-1 text-sm font-black">{project.assignedTo || 'Equipe StudioDesk'}</p></div></div></div> : <div className="rounded-3xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center text-sm text-[#6B7280]">A agência ainda não vinculou projetos ao seu acesso.</div>}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-sm font-black"><Video className="h-4 w-4 text-[#2F6F9C]" />Aprovações</div><div className="mt-4 space-y-3">{clientApprovals.length === 0 ? <p className="text-xs text-[#6B7280]">Nenhum material aguardando resposta.</p> : clientApprovals.map(item => <div key={item.id} className="rounded-2xl border border-[#DDE3E8] p-4"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-[#6B7280]">{item.projectTitle || 'Projeto'} · {item.status}</p></div><span className="text-xs font-bold text-[#6B7280]">{item.category}</span></div>{['pending','in_review','needs_revision'].includes(item.status) && <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => void respond(item.id, 'approved')} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-4 w-4" />Aprovar</button><button disabled={busy} onClick={() => void respond(item.id, 'needs_revision')} className="inline-flex items-center gap-1 rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-amber-700">Solicitar ajustes</button><button disabled={busy} onClick={() => void respond(item.id, 'rejected')} className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700"><XCircle className="h-4 w-4" />Reprovar</button></div>}</div>)}</div></div>
          <div className="rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-sm font-black"><MessageCircle className="h-4 w-4 text-[#2F6F9C]" />Comunicação com a agência</div><div className="mt-4 max-h-64 space-y-2 overflow-y-auto">{projectMessages.length === 0 ? <p className="text-xs text-[#6B7280]">Nenhuma mensagem neste projeto.</p> : projectMessages.map(item => <div key={item.id} className={`rounded-2xl p-3 text-xs ${item.sender === 'client' ? 'ml-8 bg-[#E8F4FA]' : 'mr-8 bg-[#F5F7F9]'}`}><p className="font-bold">{item.senderName}</p><p className="mt-1">{item.content}</p></div>)}</div><div className="mt-4 flex gap-2"><input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send(); }} placeholder="Escreva uma mensagem..." className="min-w-0 flex-1 rounded-xl border border-[#DDE3E8] px-3 py-2 text-sm outline-none focus:border-[#66acd7]" disabled={!project || busy} /><button onClick={() => void send()} disabled={!project || busy || !message.trim()} className="rounded-xl bg-[#111111] px-3 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></div></div>
        </div>
      </section>
    </main>
  </div>;
};
