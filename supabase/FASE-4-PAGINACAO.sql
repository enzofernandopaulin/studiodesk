-- StudioDesk — Fase 4: índices para paginação estável
-- Seguro para executar mais de uma vez. Não altera nem remove registros.

begin;

create index if not exists idx_leads_workspace_created_id
  on public.leads(workspace_id, created_at desc, id);
create index if not exists idx_clients_workspace_created_id
  on public.clients(workspace_id, created_at desc, id);
create index if not exists idx_projects_workspace_created_id
  on public.projects(workspace_id, created_at desc, id);
create index if not exists idx_tasks_workspace_created_id
  on public.tasks(workspace_id, created_at desc, id);
create index if not exists idx_calendar_workspace_date_id
  on public.calendar_events(workspace_id, date_value, id);
create index if not exists idx_approvals_workspace_created_id
  on public.approval_requests(workspace_id, created_at desc, id);
create index if not exists idx_messages_workspace_timestamp_id
  on public.messages(workspace_id, timestamp_value, id);
create index if not exists idx_communications_workspace_timestamp_id
  on public.communications(workspace_id, timestamp_value, id);
create index if not exists idx_timeline_workspace_timestamp_id
  on public.timeline_events(workspace_id, timestamp_value desc, id);

commit;
