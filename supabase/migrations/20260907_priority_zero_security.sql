begin;

-- Convites só podem ser manipulados pelas APIs server-side.
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  token_hash text not null unique,
  email text,
  invited_name text,
  job_title text,
  role text not null default 'colaborador' check (role in ('admin','gestor','colaborador')),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  max_uses integer not null default 25 check (max_uses between 1 and 50),
  uses_count integer not null default 0 check (uses_count >= 0),
  created_at timestamptz not null default now()
);
alter table public.workspace_invitations enable row level security;
revoke all on public.workspace_invitations from anon, authenticated;
alter table public.workspace_invitations add column if not exists max_uses integer not null default 25;
alter table public.workspace_invitations add column if not exists uses_count integer not null default 0;
alter table public.workspace_invitations add column if not exists invited_name text;
alter table public.workspace_invitations add column if not exists job_title text;
create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations(workspace_id, created_at desc);

alter table public.workspaces
  add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.workspaces
  add column if not exists plan text not null default 'individual';

with owners as (
  select distinct on (wm.workspace_id) wm.workspace_id, wm.user_id
  from public.workspace_members wm
  order by wm.workspace_id, (wm.role = 'admin') desc, wm.created_at
)
update public.workspaces w
set owner_id = owners.user_id
from owners
where owners.workspace_id = w.id and w.owner_id is null;

-- A sincronização por snapshot apagava o workspace inteiro e podia ser chamada
-- por qualquer membro autenticado. O frontend usa mutações por entidade.
drop function if exists public.sync_workspace(jsonb);

-- Relaciona o cartão exibido na equipe ao usuário que realmente possui acesso.
alter table public.team_members
  add column if not exists user_id uuid references auth.users(id) on delete set null;

update public.team_members
set user_id = substring(id from 4)::uuid
where user_id is null
  and id ~ '^tm_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
  and exists (
    select 1 from auth.users u where u.id = substring(team_members.id from 4)::uuid
  );

create unique index if not exists team_members_workspace_user_idx
  on public.team_members(workspace_id, user_id)
  where user_id is not null;

-- As decisões de autorização usam o papel do usuário no workspace da própria
-- linha, inclusive quando a conta participa de mais de um workspace.
create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events','tasks','messages',
    'communications','timeline_events','team_members','integrations'
  ] loop
    execute format('drop policy if exists "workspace_member_all" on public.%I', t);
    execute format('drop policy if exists "workspace_member_select" on public.%I', t);
    execute format('drop policy if exists "workspace_manager_insert" on public.%I', t);
    execute format('drop policy if exists "workspace_manager_update" on public.%I', t);
    execute format('drop policy if exists "workspace_manager_delete" on public.%I', t);
    execute format('drop policy if exists "workspace_member_insert" on public.%I', t);
    execute format('drop policy if exists "workspace_member_update" on public.%I', t);
    execute format('drop policy if exists "workspace_member_delete" on public.%I', t);
    execute format('drop policy if exists "workspace_admin_insert" on public.%I', t);
    execute format('drop policy if exists "workspace_admin_update" on public.%I', t);
    execute format('drop policy if exists "workspace_admin_delete" on public.%I', t);
    execute format('create policy "workspace_member_select" on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events'
  ] loop
    execute format('create policy "workspace_manager_insert" on public.%I for insert to authenticated with check (public.has_workspace_role(workspace_id, array[''admin'',''gestor'']))', t);
    execute format('create policy "workspace_manager_update" on public.%I for update to authenticated using (public.has_workspace_role(workspace_id, array[''admin'',''gestor''])) with check (public.has_workspace_role(workspace_id, array[''admin'',''gestor'']))', t);
    execute format('create policy "workspace_manager_delete" on public.%I for delete to authenticated using (public.has_workspace_role(workspace_id, array[''admin'',''gestor'']))', t);
  end loop;

  foreach t in array array['tasks','messages','communications','timeline_events'] loop
    execute format('create policy "workspace_member_insert" on public.%I for insert to authenticated with check (public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_member_update" on public.%I for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_member_delete" on public.%I for delete to authenticated using (public.is_workspace_member(workspace_id))', t);
  end loop;

  foreach t in array array['team_members','integrations'] loop
    execute format('create policy "workspace_admin_insert" on public.%I for insert to authenticated with check (public.has_workspace_role(workspace_id, array[''admin'']))', t);
    execute format('create policy "workspace_admin_update" on public.%I for update to authenticated using (public.has_workspace_role(workspace_id, array[''admin''])) with check (public.has_workspace_role(workspace_id, array[''admin'']))', t);
    execute format('create policy "workspace_admin_delete" on public.%I for delete to authenticated using (public.has_workspace_role(workspace_id, array[''admin'']))', t);
  end loop;
end $$;

drop policy if exists "workspace_admin_members_insert" on public.workspace_members;
drop policy if exists "workspace_admin_members_update" on public.workspace_members;
drop policy if exists "workspace_admin_members_delete" on public.workspace_members;
create policy "workspace_admin_members_insert" on public.workspace_members for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['admin']));
create policy "workspace_admin_members_update" on public.workspace_members for update to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']))
  with check (public.has_workspace_role(workspace_id, array['admin']));
create policy "workspace_admin_members_delete" on public.workspace_members for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['admin']));

-- Planos, e-mail, papel e workspace ativo não podem ser forjados pelo cliente.
create or replace function public.protect_profile_membership_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_role text;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  new.id := old.id;
  new.email := old.email;
  new.plan := old.plan;

  select wm.role into membership_role
  from public.workspace_members wm
  where wm.user_id = old.id
    and wm.workspace_id = new.workspace_id
  limit 1;

  if membership_role is null then
    new.workspace_id := old.workspace_id;
    new.role := old.role;
  else
    new.role := membership_role;
  end if;
  return new;
end;
$$;

-- Repara perfil, membership e workspace em uma única transação PostgreSQL.
create or replace function public.bootstrap_user_session(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_company_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  active_workspace_id uuid;
  active_role text;
  workspace_name text;
  safe_name text := left(coalesce(nullif(trim(p_name), ''), split_part(coalesce(p_email, ''), '@', 1)), 120);
  safe_company text := left(coalesce(nullif(trim(p_company_name), ''), 'Meu Workspace'), 120);
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuário inválido';
  end if;

  select p.workspace_id, wm.role
    into active_workspace_id, active_role
  from public.profiles p
  join public.workspace_members wm
    on wm.workspace_id = p.workspace_id and wm.user_id = p_user_id
  where p.id = p_user_id
  limit 1;

  if active_workspace_id is null then
    select wm.workspace_id, wm.role
      into active_workspace_id, active_role
    from public.workspace_members wm
    where wm.user_id = p_user_id
    order by wm.created_at
    limit 1;
  end if;

  if active_workspace_id is null then
    insert into public.workspaces(name, owner_id, plan)
    values (safe_company, p_user_id, 'individual')
    returning id into active_workspace_id;

    active_role := 'admin';
    insert into public.workspace_members(workspace_id, user_id, role)
    values (active_workspace_id, p_user_id, active_role);
  end if;

  select name into workspace_name
  from public.workspaces
  where id = active_workspace_id;

  insert into public.profiles(id, workspace_id, name, email, company_name, role)
  values (p_user_id, active_workspace_id, safe_name, left(coalesce(p_email, ''), 320), workspace_name, active_role)
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    name = case when trim(public.profiles.name) = '' then excluded.name else public.profiles.name end,
    email = excluded.email,
    company_name = excluded.company_name,
    role = excluded.role,
    updated_at = now();

  update public.team_members
  set user_id = p_user_id,
      name = case when trim(name) = '' then safe_name else name end,
      email = left(coalesce(p_email, ''), 320),
      access_level = active_role,
      status = 'ativo'
  where workspace_id = active_workspace_id
    and (user_id = p_user_id or (p_email <> '' and lower(email) = lower(p_email)));

  if not found then
    insert into public.team_members(id, workspace_id, user_id, name, email, role, access_level, avatar, projects_count, status)
    values ('tm_' || p_user_id::text, active_workspace_id, p_user_id, safe_name, left(coalesce(p_email, ''), 320),
      case when active_role = 'admin' then 'Administrador' else 'Membro da equipe' end,
      active_role, '', 0, 'ativo');
  end if;

  return active_workspace_id;
end;
$$;

revoke all on function public.bootstrap_user_session(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.bootstrap_user_session(uuid, text, text, text) to service_role;

-- Remove o cartão e a autorização real do membro de forma atômica.
create or replace function public.remove_workspace_member(
  p_requester_id uuid,
  p_workspace_id uuid,
  p_member_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  requester_name text;
  target_user_id uuid;
  target_name text;
  target_email text;
  target_role text;
  admin_count integer;
  fallback_workspace_id uuid;
  fallback_role text;
  fallback_workspace_name text;
begin
  select role into requester_role
  from public.workspace_members
  where workspace_id = p_workspace_id and user_id = p_requester_id;
  if requester_role is distinct from 'admin' then
    raise exception 'Somente administradores podem remover membros';
  end if;

  select user_id, name, email
    into target_user_id, target_name, target_email
  from public.team_members
  where workspace_id = p_workspace_id and id = p_member_id
  for update;
  if not found then raise exception 'Membro não encontrado'; end if;

  if target_user_id is null
    and p_member_id ~ '^tm_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
  then
    target_user_id := substring(p_member_id from 4)::uuid;
  end if;
  if target_user_id is null and coalesce(target_email, '') <> '' then
    select id into target_user_id
    from public.profiles
    where lower(email) = lower(target_email)
    limit 1;
  end if;

  if target_user_id is null then
    delete from public.team_members where workspace_id = p_workspace_id and id = p_member_id;
    return jsonb_build_object('membershipRemoved', false, 'profileUpdated', false);
  end if;
  if target_user_id = p_requester_id then
    raise exception 'Um administrador não pode remover o próprio acesso';
  end if;

  select role into target_role
  from public.workspace_members
  where workspace_id = p_workspace_id and user_id = target_user_id
  for update;

  if target_role = 'admin' then
    select count(*) into admin_count
    from public.workspace_members
    where workspace_id = p_workspace_id and role = 'admin';
    if admin_count <= 1 then raise exception 'Não é possível remover o último administrador'; end if;
  end if;

  if exists (select 1 from public.profiles where id = target_user_id and workspace_id = p_workspace_id) then
    select wm.workspace_id, wm.role
      into fallback_workspace_id, fallback_role
    from public.workspace_members wm
    where wm.user_id = target_user_id and wm.workspace_id <> p_workspace_id
    order by wm.created_at
    limit 1;

    if fallback_workspace_id is not null then
      select name into fallback_workspace_name from public.workspaces where id = fallback_workspace_id;
      update public.profiles
      set workspace_id = fallback_workspace_id, role = fallback_role,
          company_name = fallback_workspace_name, updated_at = now()
      where id = target_user_id;
    else
      update public.profiles
      set workspace_id = null, company_name = 'Meu Workspace', role = 'admin', updated_at = now()
      where id = target_user_id;
    end if;
  end if;

  delete from public.workspace_members
  where workspace_id = p_workspace_id and user_id = target_user_id;
  delete from public.team_members
  where workspace_id = p_workspace_id
    and (id = p_member_id or user_id = target_user_id);

  select coalesce(nullif(name, ''), email, 'Administrador') into requester_name
  from public.profiles where id = p_requester_id;
  insert into public.timeline_events(
    id, workspace_id, timestamp_value, time_string, actor, action, details, category, reference_id
  ) values (
    'evt_' || gen_random_uuid()::text, p_workspace_id, now(), to_char(now(), 'HH24:MI'),
    requester_name, 'removeu um membro da equipe', coalesce(target_name, target_email, target_user_id::text),
    'comunicacao', p_member_id
  );

  return jsonb_build_object('membershipRemoved', target_role is not null, 'profileUpdated', true);
end;
$$;

revoke all on function public.remove_workspace_member(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid, text) to service_role;

-- Invalida links administrativos antigos; novos links aceitam apenas gestor/colaborador.
update public.workspace_invitations
set expires_at = now()
where role = 'admin' and accepted_at is null and expires_at > now();

commit;
