-- Fase 2: integridade estrutural e índices.
-- Rode após 20260914_fase_1_seguranca_critica.sql.

-- Excluir um workspace não deve apagar a conta/perfil do usuário.
do $$
declare fk_name text;
begin
  select c.conname into fk_name
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_attribute a on a.attrelid=t.oid and a.attnum=any(c.conkey)
  where t.relname='profiles' and a.attname='workspace_id' and c.contype='f'
  limit 1;
  if fk_name is not null then execute format('alter table public.profiles drop constraint %I',fk_name); end if;
end $$;
alter table public.profiles
  add constraint profiles_workspace_id_fkey foreign key(workspace_id)
  references public.workspaces(id) on delete set null not valid;

-- Relações que antes aceitavam IDs inexistentes ficam protegidas para novas escritas.
do $$
begin
  if not exists(select 1 from pg_constraint where conname='messages_client_id_fkey') then
    alter table public.messages add constraint messages_client_id_fkey foreign key(client_id) references public.clients(id) on delete cascade not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='messages_project_id_fkey') then
    alter table public.messages add constraint messages_project_id_fkey foreign key(project_id) references public.projects(id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='messages_task_id_fkey') then
    alter table public.messages add constraint messages_task_id_fkey foreign key(task_id) references public.tasks(id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='communications_client_id_fkey') then
    alter table public.communications add constraint communications_client_id_fkey foreign key(client_id) references public.clients(id) on delete cascade not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='communications_project_id_fkey') then
    alter table public.communications add constraint communications_project_id_fkey foreign key(project_id) references public.projects(id) on delete set null not valid;
  end if;
end $$;

-- Índices compostos acompanham os filtros por workspace e a ordenação da interface.
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
