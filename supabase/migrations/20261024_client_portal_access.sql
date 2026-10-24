begin;

-- Perfil cliente separado dos membros administrativos.
alter table public.profiles
  add column if not exists client_id text;

-- Permite que a conta convidada exista no workspace sem receber acesso interno.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.workspace_members'::regclass
      and conname = 'workspace_members_role_check'
  ) then
    alter table public.workspace_members drop constraint workspace_members_role_check;
  end if;
  alter table public.workspace_members
    add constraint workspace_members_role_check
    check (role in ('admin','gestor','colaborador','cliente'));
exception when duplicate_object then null;
end $$;

create table if not exists public.client_portal_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text not null,
  token_hash text not null unique,
  email text,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  max_uses integer not null default 1 check (max_uses between 1 and 10),
  uses_count integer not null default 0 check (uses_count >= 0),
  created_at timestamptz not null default now(),
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id) on delete cascade
);

create index if not exists client_portal_invites_workspace_idx
  on public.client_portal_invitations(workspace_id, created_at desc);
create index if not exists profiles_client_idx
  on public.profiles(workspace_id, client_id);

alter table public.client_portal_invitations enable row level security;
revoke all on public.client_portal_invitations from public, anon, authenticated;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.role in ('admin','gestor','colaborador')
  );
$$;

create or replace function public.is_workspace_client(target_workspace uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.role = 'cliente'
  );
$$;

create or replace function public.current_client_id()
returns text
language sql stable security definer set search_path = public
as $$
  select p.client_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

grant execute on function public.is_workspace_client(uuid) to authenticated;
grant execute on function public.current_client_id() to authenticated;
revoke execute on function public.is_workspace_client(uuid) from anon, public;
revoke execute on function public.current_client_id() from anon, public;

-- O perfil cliente não acessa o CRM interno nem os canais administrativos.
do $$
declare t text;
begin
  foreach t in array array['leads','clients','kanban_columns','projects','project_deliverables','media_approvals','approval_comments','approval_requests','calendar_events','tasks','messages','communications','timeline_events','team_members','integrations'] loop
    execute format('drop policy if exists "workspace_member_select" on public.%I', t);
    execute format('create policy "workspace_member_select" on public.%I for select to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

-- Dados públicos do portal: somente o cliente vinculado ao registro.
drop policy if exists client_portal_clients_select on public.clients;
create policy client_portal_clients_select on public.clients
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and id = public.current_client_id());

drop policy if exists client_portal_projects_select on public.projects;
create policy client_portal_projects_select on public.projects
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and client_id = public.current_client_id());

drop policy if exists client_portal_deliverables_select on public.project_deliverables;
create policy client_portal_deliverables_select on public.project_deliverables
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and exists (
    select 1 from public.projects p where p.workspace_id = project_deliverables.workspace_id and p.id = project_deliverables.project_id and p.client_id = public.current_client_id()
  ));

drop policy if exists client_portal_media_select on public.media_approvals;
create policy client_portal_media_select on public.media_approvals
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and exists (
    select 1 from public.projects p where p.workspace_id = media_approvals.workspace_id and p.id = media_approvals.project_id and p.client_id = public.current_client_id()
  ));

drop policy if exists client_portal_approvals_select on public.approval_requests;
create policy client_portal_approvals_select on public.approval_requests
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and client_id = public.current_client_id());

drop policy if exists client_portal_tasks_select on public.tasks;
create policy client_portal_tasks_select on public.tasks
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and (
    client_id = public.current_client_id() or exists (
      select 1 from public.projects p where p.workspace_id = tasks.workspace_id and p.id = tasks.project_id and p.client_id = public.current_client_id()
    )
  ));

drop policy if exists client_portal_comments_select on public.approval_comments;
create policy client_portal_comments_select on public.approval_comments
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and (
    exists (select 1 from public.media_approvals m join public.projects p on p.workspace_id = m.workspace_id and p.id = m.project_id where m.workspace_id = approval_comments.workspace_id and m.id = approval_comments.media_approval_id and p.client_id = public.current_client_id())
    or exists (select 1 from public.approval_requests a where a.workspace_id = approval_comments.workspace_id and a.id = approval_comments.approval_request_id and a.client_id = public.current_client_id())
  ));

drop policy if exists client_portal_messages_select on public.messages;
create policy client_portal_messages_select on public.messages
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and client_id = public.current_client_id());

drop policy if exists client_portal_communications_select on public.communications;
create policy client_portal_communications_select on public.communications
  for select to authenticated
  using (workspace_id = public.current_workspace_id() and public.is_workspace_client(workspace_id) and client_id = public.current_client_id());

-- Escritas do cliente passam por funções que fixam autor, workspace e client_id.
create or replace function public.client_send_message(p_project_id text, p_content text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare wid uuid; cid text; mid text;
begin
  select p.workspace_id, p.client_id into wid, cid from public.profiles p where p.id = auth.uid();
  if wid is null or cid is null then raise exception 'Conta de cliente não vinculada.' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.workspace_members wm where wm.workspace_id = wid and wm.user_id = auth.uid() and wm.role = 'cliente') then raise exception 'Acesso de cliente inválido.' using errcode = '42501'; end if;
  if not exists (select 1 from public.projects p where p.workspace_id = wid and p.id = p_project_id and p.client_id = cid) then raise exception 'Projeto não pertence ao cliente.' using errcode = '42501'; end if;
  if length(trim(coalesce(p_content, ''))) = 0 or length(p_content) > 10000 then raise exception 'Mensagem inválida.' using errcode = '22023'; end if;
  mid := 'msg_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.messages(id, workspace_id, sender, sender_name, content, timestamp_value, client_id, project_id, media_type)
  select mid, wid, 'client', coalesce(p.name, 'Cliente'), trim(p_content), now()::text, cid, p_project_id, 'text'
  from public.profiles p where p.id = auth.uid();
  return jsonb_build_object('id', mid);
end $$;

create or replace function public.client_respond_to_approval(p_approval_id text, p_status text, p_feedback text default null)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare wid uuid; cid text; updated_id text;
begin
  select p.workspace_id, p.client_id into wid, cid from public.profiles p where p.id = auth.uid();
  if wid is null or cid is null or p_status not in ('approved','rejected','needs_revision') then raise exception 'Resposta de aprovação inválida.' using errcode = '22023'; end if;
  update public.approval_requests
  set status = p_status, feedback_notes = nullif(trim(coalesce(p_feedback, '')), ''), reviewed_by = auth.uid()::text, reviewed_at = now()
  where workspace_id = wid and id = p_approval_id and client_id = cid
  returning id into updated_id;
  if updated_id is null then raise exception 'Aprovação não encontrada para este cliente.' using errcode = '42501'; end if;
  return jsonb_build_object('id', updated_id, 'status', p_status);
end $$;

revoke all on function public.client_send_message(text, text) from public, anon;
revoke all on function public.client_respond_to_approval(text, text, text) from public, anon;
grant execute on function public.client_send_message(text, text) to authenticated;
grant execute on function public.client_respond_to_approval(text, text, text) to authenticated;

commit;
