import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getWorkspaceId } from './workspaceRepository';

export const REALTIME_TABLES = [
  'leads',
  'clients',
  'kanban_columns',
  'projects',
  'project_deliverables',
  'media_approvals',
  'approval_comments',
  'approval_requests',
  'calendar_events',
  'tasks',
  'messages',
  'communications',
  'timeline_events',
  'team_members',
  'integrations',
] as const;

export type RealtimeTable = typeof REALTIME_TABLES[number];
export type StudioRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

interface SubscribeOptions {
  onChange: (table: RealtimeTable, payload: StudioRealtimePayload) => void;
  onStatus?: (status: string) => void;
}

/**
 * Opens one multiplexed Realtime channel for the current workspace.
 * A single channel is cheaper and easier to manage than one channel per table.
 */
export async function subscribeToWorkspaceRealtime(
  userId: string,
  options: SubscribeOptions,
): Promise<RealtimeChannel | null> {
  if (!supabase) return null;

  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId) return null;

  const channel = supabase.channel(`workspace-realtime:${workspaceId}`);

  for (const table of REALTIME_TABLES) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => options.onChange(table, payload),
    );
  }

  channel.subscribe((status) => options.onStatus?.(status));
  return channel;
}

export async function removeRealtimeChannel(channel: RealtimeChannel | null | undefined) {
  if (!channel || !supabase) return;
  await supabase.removeChannel(channel);
}
