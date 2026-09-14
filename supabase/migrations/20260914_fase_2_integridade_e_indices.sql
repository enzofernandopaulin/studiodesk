-- Fase 2: integridade estrutural e índices.
-- Rode após a Fase 1. Pode ser executada mais de uma vez.
begin;

do $$
declare fk_name text;
begin
  select c.conname into fk_name
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  join pg_attribute a on a.attrelid=t.oid and a.attnum=any(c.conkey)
  where n.nspname='public' and t.relname='profiles'
    and a.attname='workspace_id' and c.contype='f'
  limit 1;
  if fk_name is not null then
    execute format('alter table public.profiles drop constraint %I',fk_name);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_workspace_id_fkey
  foreign key(workspace_id) references public.workspaces(id)
  on delete set null not valid;

do $$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.messages'::regclass and conname='messages_workspace_client_fkey') then
    alter table public.messages add constraint messages_workspace_client_fkey
      foreign key(workspace_id,client_id) references public.clients(workspace_id,id) on delete cascade not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.messages'::regclass and conname='messages_workspace_project_fkey') then
    alter table public.messages add constraint messages_workspace_project_fkey
      foreign key(workspace_id,project_id) references public.projects(workspace_id,id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.messages'::regclass and conname='messages_workspace_task_fkey') then
    alter table public.messages add constraint messages_workspace_task_fkey
      foreign key(workspace_id,task_id) references public.tasks(workspace_id,id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.approval_comments'::regclass and conname='comments_workspace_media_fkey') then
    alter table public.approval_comments add constraint comments_workspace_media_fkey
      foreign key(workspace_id,media_approval_id) references public.media_approvals(workspace_id,id) on delete cascade not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.approval_comments'::regclass and conname='comments_workspace_approval_fkey') then
    alter table public.approval_comments add constraint comments_workspace_approval_fkey
      foreign key(workspace_id,approval_request_id) references public.approval_requests(workspace_id,id) on delete cascade not valid;
  end if;
end $$;

create index if not exists leads_workspace_created_idx on public.leads(workspace_id,created_at desc,id);
create index if not exists clients_workspace_created_idx on public.clients(workspace_id,created_at desc,id);
create index if not exists projects_workspace_created_idx on public.projects(workspace_id,created_at desc,id);
create index if not exists tasks_workspace_created_idx on public.tasks(workspace_id,created_at desc,id);
create index if not exists timeline_workspace_timestamp_idx on public.timeline_events(workspace_id,timestamp_value desc,id);
create index if not exists deliverables_workspace_project_idx on public.project_deliverables(workspace_id,project_id);
create index if not exists media_workspace_project_idx on public.media_approvals(workspace_id,project_id);
create index if not exists comments_workspace_media_idx on public.approval_comments(workspace_id,media_approval_id);
create index if not exists memberships_user_workspace_idx on public.workspace_members(user_id,workspace_id);
create index if not exists invitations_token_idx on public.workspace_invitations(token_hash);

commit;
