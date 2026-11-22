import { supabase } from './supabase';

export interface WorkspaceChatMessage {
  id: string;
  workspaceId: string;
  senderUserId: string;
  content: string;
  createdAt: string;
}

export interface WorkspaceChatCursor {
  createdAt: string;
  id: string;
}

export interface WorkspaceChatPage {
  messages: WorkspaceChatMessage[];
  hasMore: boolean;
  nextCursor: WorkspaceChatCursor | null;
}

const MESSAGE_COLUMNS = 'workspace_id, id, sender_user_id, content, created_at';

function mapMessage(row: Record<string, unknown>): WorkspaceChatMessage {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    senderUserId: String(row.sender_user_id),
    content: String(row.content),
    createdAt: String(row.created_at),
  };
}

function cursorFromMessage(message: WorkspaceChatMessage): WorkspaceChatCursor {
  return { createdAt: message.createdAt, id: message.id };
}

export async function loadWorkspaceChatPage(
  cursor: WorkspaceChatCursor | null = null,
  pageSize = 40,
): Promise<WorkspaceChatPage> {
  if (!supabase) return { messages: [], hasMore: false, nextCursor: null };

  let query = supabase
    .from('workspace_chat_messages')
    .select(MESSAGE_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize);

  // A página sempre vem do mais recente para o mais antigo. O cursor é o
  // item mais antigo já carregado, evitando offset instável durante Realtime.
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  const messages = (data ?? []).map(row => mapMessage(row as Record<string, unknown>));
  return {
    messages,
    hasMore: messages.length === pageSize,
    nextCursor: messages.length ? cursorFromMessage(messages[messages.length - 1]) : cursor,
  };
}

export async function sendWorkspaceChatMessage(content: string): Promise<WorkspaceChatMessage> {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const normalized = content.trim();
  if (!normalized) throw new Error('Digite uma mensagem.');

  // O banco deriva workspace_id, sender_user_id e created_at pelo trigger.
  const { data, error } = await supabase
    .from('workspace_chat_messages')
    .insert({ content: normalized })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) throw error;
  return mapMessage(data as Record<string, unknown>);
}

export async function markWorkspaceChatRead(messageId: string): Promise<void> {
  if (!supabase || !messageId) return;
  const { error } = await supabase.rpc('mark_workspace_chat_read', { p_message_id: messageId });
  if (error) throw error;
}

export async function loadWorkspaceChatUnreadCount(): Promise<number> {
  if (!supabase) return 0;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return 0;
  const currentUserId = authData.user.id;

  const { data: cursor, error: cursorError } = await supabase
    .from('workspace_chat_read_cursors')
    .select('workspace_id, last_read_message_id')
    .maybeSingle();
  if (cursorError) throw cursorError;

  let query = supabase
    .from('workspace_chat_messages')
    .select('id', { count: 'exact', head: true })
    .neq('sender_user_id', currentUserId);

  if (cursor?.last_read_message_id) {
    const { data: lastRead, error: lastReadError } = await supabase
      .from('workspace_chat_messages')
      .select('id, created_at')
      .eq('workspace_id', cursor.workspace_id)
      .eq('id', cursor.last_read_message_id)
      .maybeSingle();
    if (lastReadError) throw lastReadError;
    if (!lastRead) return 0;
    query = query.or(`created_at.gt.${lastRead.created_at},and(created_at.eq.${lastRead.created_at},id.gt.${lastRead.id})`);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
