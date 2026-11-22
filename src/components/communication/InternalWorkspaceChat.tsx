import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Loader2, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  loadWorkspaceChatPage,
  loadWorkspaceChatUnreadCount,
  markWorkspaceChatRead,
  sendWorkspaceChatMessage,
  type WorkspaceChatMessage,
} from '../../lib/workspaceChatRepository';

const PAGE_SIZE = 40;

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(date);
}

export const InternalWorkspaceChat: React.FC = () => {
  const { user, team, chatRefreshToken, addToast } = useApp();
  const [messages, setMessages] = useState<WorkspaceChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const lastMarkedMessageRef = useRef<string | null>(null);
  const firstLoadRef = useRef(true);

  const memberById = useMemo(() => {
    const map = new Map<string, { name: string; avatar?: string }>();
    team.forEach(member => {
      map.set(member.userId || member.id, { name: member.name, avatar: member.avatar });
    });
    if (user.id) map.set(user.id, { name: user.name || 'Você', avatar: user.avatar });
    return map;
  }, [team, user.id, user.name, user.avatar]);

  const detailsFor = useCallback((senderId: string) => {
    return memberById.get(senderId) || { name: senderId === user.id ? (user.name || 'Você') : 'Membro do workspace' };
  }, [memberById, user.id, user.name]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
    atBottomRef.current = true;
    setIsAtBottom(true);
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      setUnreadCount(await loadWorkspaceChatUnreadCount());
    } catch (loadError) {
      console.error('StudioDesk: falha ao calcular mensagens não lidas', loadError);
    }
  }, []);

  const markLatestAsRead = useCallback(async (candidateMessages: WorkspaceChatMessage[]) => {
    if (!atBottomRef.current || !candidateMessages.length) return;
    const latest = candidateMessages.reduce((currentLatest, candidate) => (
      candidate.createdAt > currentLatest.createdAt
      || (candidate.createdAt === currentLatest.createdAt && candidate.id > currentLatest.id)
        ? candidate
        : currentLatest
    ));
    setUnreadCount(0);
    if (lastMarkedMessageRef.current === latest.id) return;
    lastMarkedMessageRef.current = latest.id;
    try {
      await markWorkspaceChatRead(latest.id);
    } catch (markError) {
      if (lastMarkedMessageRef.current === latest.id) lastMarkedMessageRef.current = null;
      console.error('StudioDesk: falha ao marcar o chat como lido', markError);
    }
  }, []);

  const loadFirstPage = useCallback(async (preserveScroll = false) => {
    setError('');
    try {
      const page = await loadWorkspaceChatPage(null, PAGE_SIZE);
      setMessages(current => {
        const merged = new Map<string, WorkspaceChatMessage>();
        [...current, ...page.messages].forEach(message => merged.set(message.id, message));
        return [...merged.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
      setHasMore(current => current || page.hasMore);
      if (!preserveScroll) {
        requestAnimationFrame(() => scrollToBottom('auto'));
        await markLatestAsRead(page.messages);
      } else if (atBottomRef.current && page.messages[0]) {
        requestAnimationFrame(() => scrollToBottom());
        await markLatestAsRead(page.messages);
      } else {
        await refreshUnread();
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Não foi possível carregar o chat.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [markLatestAsRead, refreshUnread, scrollToBottom]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }
    void loadFirstPage(true);
  }, [chatRefreshToken, loadFirstPage]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const nextAtBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
    atBottomRef.current = nextAtBottom;
    setIsAtBottom(nextAtBottom);
    if (nextAtBottom) void markLatestAsRead(messages);
  };

  const loadOlder = async () => {
    if (isLoadingOlder || !hasMore) return;
    setIsLoadingOlder(true);
    const node = scrollRef.current;
    const previousHeight = node?.scrollHeight ?? 0;
    try {
      const oldest = messages[0];
      if (!oldest) return;
      const page = await loadWorkspaceChatPage({ createdAt: oldest.createdAt, id: oldest.id }, PAGE_SIZE);
      setMessages(current => {
        const merged = new Map<string, WorkspaceChatMessage>();
        [...page.messages, ...current].forEach(message => merged.set(message.id, message));
        return [...merged.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
      setHasMore(page.hasMore);
      requestAnimationFrame(() => {
        if (node) node.scrollTop = node.scrollHeight - previousHeight;
      });
    } catch (loadError) {
      addToast('error', 'Histórico não carregado', loadError instanceof Error ? loadError.message : 'Tente novamente.');
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleSend = async (event: React.FormEvent | React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    try {
      const sent = await sendWorkspaceChatMessage(draft);
      setMessages(current => [...current.filter(message => message.id !== sent.id), sent].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      setDraft('');
      requestAnimationFrame(() => scrollToBottom());
      await markLatestAsRead([sent]);
    } catch (sendError) {
      addToast('error', 'Mensagem não enviada', sendError instanceof Error ? sendError.message : 'Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const groupedMessages = useMemo(() => {
    const groups: Array<{ day: string; messages: WorkspaceChatMessage[] }> = [];
    messages.forEach(message => {
      const day = formatDay(message.createdAt);
      const last = groups[groups.length - 1];
      if (!last || last.day !== day) groups.push({ day, messages: [message] });
      else last.messages.push(message);
    });
    return groups;
  }, [messages]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8" id="workspace-chat-view">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#2F6F9C]">
            <MessageCircle className="h-5 w-5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Workspace</span>
          </div>
          <h2 className="font-display text-3xl font-black tracking-tight text-[#111111]">Chat interno</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">Converse com as pessoas do seu workspace em um canal único, seguro e em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Em tempo real
          </span>
          {unreadCount > 0 && <span className="rounded-full bg-[#2F6F9C] px-3 py-1.5 text-xs font-bold text-white">{unreadCount} não lida{unreadCount === 1 ? '' : 's'}</span>}
        </div>
      </div>

      <section className="flex min-h-[calc(100vh-235px)] flex-col overflow-hidden rounded-3xl border border-[#DDE3E8] bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#DDE3E8] bg-[#F5F7F9] px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm font-bold text-[#111111]">Todos os membros</p>
            <p className="text-xs text-[#6B7280]">Mensagens visíveis apenas para membros autorizados</p>
          </div>
          <button onClick={() => void loadFirstPage(true)} className="rounded-xl p-2 text-[#6B7280] transition-colors hover:bg-white hover:text-[#111111]" title="Atualizar chat" aria-label="Atualizar chat">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          {hasMore && <div className="mb-5 flex justify-center"><button onClick={() => void loadOlder()} disabled={isLoadingOlder} className="inline-flex items-center gap-2 rounded-xl border border-[#DDE3E8] px-3 py-2 text-xs font-bold text-[#2F6F9C] hover:bg-[#F5F7F9] disabled:opacity-50">{isLoadingOlder && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Carregar mensagens anteriores</button></div>}
          {isLoading ? <div className="flex h-64 items-center justify-center text-sm text-[#6B7280]"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando conversa...</div> : error ? <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center"><p className="text-sm font-semibold text-rose-700">{error}</p><button onClick={() => void loadFirstPage()} className="rounded-xl bg-[#111111] px-4 py-2 text-xs font-bold text-white">Tentar novamente</button></div> : messages.length === 0 ? <div className="flex h-64 flex-col items-center justify-center text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#66acd7]/15 text-[#2F6F9C]"><MessageCircle className="h-6 w-6" /></div><p className="text-sm font-bold text-[#111111]">Ainda não há mensagens</p><p className="mt-1 text-xs text-[#6B7280]">Inicie a conversa com seu workspace.</p></div> : <div className="mx-auto max-w-3xl space-y-6">{groupedMessages.map(group => <div key={group.day} className="space-y-3"><div className="flex items-center gap-3"><div className="h-px flex-1 bg-[#DDE3E8]" /><span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">{group.day}</span><div className="h-px flex-1 bg-[#DDE3E8]" /></div>{group.messages.map(message => { const mine = message.senderUserId === user.id; const sender = detailsFor(message.senderUserId); return <div key={message.id} className={`flex items-end gap-2.5 ${mine ? 'justify-end' : 'justify-start'}`}><div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#DDE3E8] text-[10px] font-bold ${mine ? 'order-2 bg-[#111111] text-white' : 'bg-[#F5F7F9] text-[#2F6F9C]'}`}>{sender.avatar ? <img src={sender.avatar} alt="" className="h-full w-full object-cover" /> : initials(sender.name)}</div><div className={`max-w-[min(82%,620px)] ${mine ? 'order-1 items-end' : 'items-start'}`}><div className={`mb-1 flex items-center gap-2 text-[10px] ${mine ? 'justify-end' : ''}`}><span className="font-bold text-[#111111]">{mine ? 'Você' : sender.name}</span><span className="text-[#9CA3AF]">{formatTime(message.createdAt)}</span></div><div className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${mine ? 'rounded-br-md bg-[#111111] text-white' : 'rounded-bl-md border border-[#DDE3E8] bg-[#F5F7F9] text-[#111111]'}`}>{message.content}</div></div></div>; })}</div>)}</div>}
          {unreadCount > 0 && !isAtBottom && <button onClick={() => { scrollToBottom(); void markLatestAsRead(messages); }} className="sticky bottom-2 mx-auto flex items-center gap-2 rounded-full bg-[#2F6F9C] px-4 py-2 text-xs font-bold text-white shadow-lg"><ArrowDown className="h-3.5 w-3.5" /> {unreadCount} nova{unreadCount === 1 ? '' : 's'} mensagem{unreadCount === 1 ? '' : 's'}</button>}
        </div>

        <form onSubmit={handleSend} className="border-t border-[#DDE3E8] bg-white p-3 sm:p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-[#DDE3E8] bg-[#F5F7F9] p-2 focus-within:border-[#66acd7] focus-within:bg-white">
            <textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(event); } }} placeholder="Escreva uma mensagem..." rows={1} maxLength={10000} className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#111111] outline-none placeholder:text-[#9CA3AF]" />
            <button type="submit" disabled={!draft.trim() || isSending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-white transition-colors hover:bg-[#2F6F9C] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Enviar mensagem">{isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
          </div>
          <p className="mt-2 px-1 text-[10px] text-[#9CA3AF]">Enter envia · Shift + Enter quebra linha</p>
        </form>
      </section>
    </div>
  );
};
