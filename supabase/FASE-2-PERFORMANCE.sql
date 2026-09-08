-- StudioDesk — Fase 2: índices e atualização instantânea da equipe
-- Seguro para executar mais de uma vez no SQL Editor do Supabase.

begin;

-- O vínculo aceito por convite nasce nesta tabela. Publicá-la no Realtime faz
-- o novo colaborador aparecer sem polling e permite refletir remoções na hora.
alter table public.workspace_members replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'workspace_members'
  ) then
    alter publication supabase_realtime add table public.workspace_members;
  end if;
end $$;

-- Índices alinhados às consultas do frontend: primeiro isola o workspace e,
-- quando aplicável, já entrega a ordenação usada pela tela.
create index if not exists idx_profiles_workspace_id
  on public.profiles(workspace_id);
create index if not exists idx_workspace_members_workspace_user
  on public.workspace_members(workspace_id, user_id);
create index if not exists idx_leads_workspace
  on public.leads(workspace_id);
create index if not exists idx_clients_workspace
  on public.clients(workspace_id);
create index if not exists idx_kanban_columns_workspace_order
  on public.kanban_columns(workspace_id, sort_order);
create index if not exists idx_projects_workspace_created
  on public.projects(workspace_id, created_at desc);
create index if not exists idx_project_deliverables_workspace_project
  on public.project_deliverables(workspace_id, project_id);
create index if not exists idx_media_approvals_workspace_project
  on public.media_approvals(workspace_id, project_id);
create index if not exists idx_approval_comments_workspace_media
  on public.approval_comments(workspace_id, media_approval_id);
create index if not exists idx_tasks_workspace_created
  on public.tasks(workspace_id, created_at desc);
create index if not exists idx_calendar_events_workspace_date
  on public.calendar_events(workspace_id, date_value);
create index if not exists idx_approval_requests_workspace_created
  on public.approval_requests(workspace_id, created_at desc);
create index if not exists idx_messages_workspace_timestamp
  on public.messages(workspace_id, timestamp_value);
create index if not exists idx_communications_workspace_timestamp
  on public.communications(workspace_id, timestamp_value);
create index if not exists idx_timeline_events_workspace_timestamp
  on public.timeline_events(workspace_id, timestamp_value desc);
create index if not exists idx_integrations_workspace
  on public.integrations(workspace_id);

commit;
