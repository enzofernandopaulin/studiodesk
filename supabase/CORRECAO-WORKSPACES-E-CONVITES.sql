-- StudioDesk — correção consolidada de workspaces e convites por link
-- Execute este arquivo inteiro UMA VEZ no SQL Editor do Supabase.
-- É idempotente: pode ser executado novamente se a primeira tentativa for interrompida.
-- Não apaga leads, clientes, projetos ou arquivos.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.workspaces') is null
     or to_regclass('public.workspace_members') is null
     or to_regclass('public.profiles') is null
     or to_regclass('public.team_members') is null then
    raise exception 'Banco base ausente. Execute primeiro supabase/schema.sql e depois este arquivo.';
  end if;
end $$;

alter table public.workspaces
  add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.workspaces
  add column if not exists plan text not null default 'individual';

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  token_hash text not null unique,
  email text,
  invited_name text,
  job_title text,
  role text not null default 'colaborador',
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  max_uses integer not null default 25,
  uses_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.workspace_invitations add column if not exists email text;
alter table public.workspace_invitations add column if not exists invited_name text;
alter table public.workspace_invitations add column if not exists job_title text;
alter table public.workspace_invitations add column if not exists max_uses integer not null default 25;
alter table public.workspace_invitations add column if not exists uses_count integer not null default 0;

update public.workspaces
set plan = 'individual'
where plan is null or plan not in ('individual','solo','studio','empresa','agencia');

update public.workspace_members
set role = case when role = 'admin' then 'admin' when role = 'gestor' then 'gestor' else 'colaborador' end
where role is null or role not in ('admin','gestor','colaborador');

update public.workspace_invitations
set role = case when role = 'admin' then 'admin' when role = 'gestor' then 'gestor' else 'colaborador' end,
    max_uses = greatest(1, least(coalesce(max_uses, 25), 50)),
    uses_count = greatest(0, coalesce(uses_count, 0));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workspaces'::regclass and conname = 'workspaces_plan_check'
  ) then
    alter table public.workspaces add constraint workspaces_plan_check
      check (plan in ('individual','solo','studio','empresa','agencia'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workspace_members'::regclass and conname = 'workspace_members_role_check'
  ) then
    alter table public.workspace_members add constraint workspace_members_role_check
      check (role in ('admin','gestor','colaborador'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workspace_invitations'::regclass and conname = 'workspace_invitations_role_check'
  ) then
    alter table public.workspace_invitations add constraint workspace_invitations_role_check
      check (role in ('admin','gestor','colaborador'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workspace_invitations'::regclass and conname = 'workspace_invitations_max_uses_check'
  ) then
    alter table public.workspace_invitations add constraint workspace_invitations_max_uses_check
      check (max_uses between 1 and 50);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workspace_invitations'::regclass and conname = 'workspace_invitations_uses_count_check'
  ) then
    alter table public.workspace_invitations add constraint workspace_invitations_uses_count_check
      check (uses_count >= 0);
  end if;
end $$;

create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations(workspace_id, created_at desc);

-- Remove temporariamente a proteção para reparar contas antigas incompletas.
drop trigger if exists protect_profile_membership_fields on public.profiles;

-- Garante que toda conta existente tenha perfil, workspace e membership.
do $$
declare
  account record;
  selected_workspace uuid;
  selected_role text;
  selected_workspace_name text;
  selected_plan text;
begin
  for account in
    select
      u.id,
      u.email as auth_email,
      u.raw_user_meta_data,
      p.workspace_id as profile_workspace_id,
      p.name as profile_name,
      p.email as profile_email,
      p.company_name as profile_company_name,
      p.plan as profile_plan
    from auth.users u
    left join public.profiles p on p.id = u.id
  loop
    selected_workspace := null;
    selected_role := null;

    select wm.workspace_id, wm.role
      into selected_workspace, selected_role
    from public.workspace_members wm
    where wm.user_id = account.id
    order by
      (wm.workspace_id = account.profile_workspace_id) desc nulls last,
      (wm.role = 'admin') desc,
      wm.created_at asc
    limit 1;

    selected_plan := case
      when account.profile_plan in ('individual','solo','studio','empresa','agencia') then account.profile_plan
      else 'individual'
    end;

    if selected_workspace is null then
      selected_workspace_name := coalesce(
        nullif(account.profile_company_name, ''),
        nullif(account.raw_user_meta_data->>'company_name', ''),
        'Meu Workspace'
      );

      insert into public.workspaces(name, owner_id, plan)
      values (selected_workspace_name, account.id, selected_plan)
      returning id into selected_workspace;

      selected_role := 'admin';
      insert into public.workspace_members(workspace_id, user_id, role)
      values (selected_workspace, account.id, selected_role)
      on conflict (workspace_id, user_id) do nothing;
    end if;

    select w.name into selected_workspace_name
    from public.workspaces w where w.id = selected_workspace;

    insert into public.profiles (
      id, workspace_id, name, email, company_name, role, plan, updated_at
    ) values (
      account.id,
      selected_workspace,
      coalesce(nullif(account.profile_name, ''), nullif(account.raw_user_meta_data->>'name', ''), split_part(coalesce(account.auth_email, ''), '@', 1), ''),
      coalesce(nullif(account.profile_email, ''), account.auth_email, ''),
      coalesce(nullif(account.profile_company_name, ''), selected_workspace_name, 'Meu Workspace'),
      coalesce(selected_role, 'colaborador'),
      selected_plan,
      now()
    )
    on conflict (id) do update set
      workspace_id = excluded.workspace_id,
      name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
      email = case when public.profiles.email = '' then excluded.email else public.profiles.email end,
      company_name = coalesce(nullif(public.profiles.company_name, ''), excluded.company_name),
      role = excluded.role,
      plan = excluded.plan,
      updated_at = now();
  end loop;
end $$;

-- Preenche proprietário e plano dos workspaces antigos.
with ranked_owners as (
  select
    wm.workspace_id,
    wm.user_id,
    row_number() over (
      partition by wm.workspace_id
      order by (wm.role = 'admin') desc, wm.created_at asc
    ) as position
  from public.workspace_members wm
)
update public.workspaces w
set owner_id = coalesce(w.owner_id, ro.user_id),
    plan = case
      when w.plan = 'individual' and p.plan in ('solo','studio','empresa','agencia') then p.plan
      else w.plan
    end,
    updated_at = now()
from ranked_owners ro
left join public.profiles p on p.id = ro.user_id
where ro.position = 1 and ro.workspace_id = w.id;

-- Funções de autorização sempre consideram o workspace ativo do perfil.
create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.workspace_id from public.profiles p where p.id = auth.uid() limit 1;
$$;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace and wm.user_id = auth.uid()
  );
$$;

create or replace function public.current_workspace_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.profiles p
  join public.workspace_members wm
    on wm.workspace_id = p.workspace_id and wm.user_id = p.id
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_workspace_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_workspace_role() = 'admin';
$$;

create or replace function public.is_workspace_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_workspace_role() in ('admin','gestor');
$$;

create or replace function public.protect_profile_membership_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_role text;
begin
  select wm.role into membership_role
  from public.workspace_members wm
  where wm.user_id = old.id and wm.workspace_id = new.workspace_id
  limit 1;

  if membership_role is null then
    new.workspace_id := old.workspace_id;
    new.role := old.role;
  else
    new.role := membership_role;
  end if;
  new.id := old.id;
  return new;
end;
$$;

create trigger protect_profile_membership_fields
before update on public.profiles
for each row execute procedure public.protect_profile_membership_fields();

-- O plano comprado pelo dono passa a valer em todos os workspaces que ele criou.
create or replace function public.sync_owner_workspace_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan is distinct from old.plan
     and new.plan in ('individual','solo','studio','empresa','agencia') then
    update public.workspaces
    set plan = new.plan, updated_at = now()
    where owner_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_owner_workspace_plan on public.profiles;
create trigger sync_owner_workspace_plan
after update of plan on public.profiles
for each row execute procedure public.sync_owner_workspace_plan();

-- Novas contas sempre recebem um workspace próprio. Depois elas podem entrar
-- em outros workspaces sem perder o workspace pessoal.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace uuid;
  workspace_name text;
begin
  workspace_name := coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'Meu Workspace');

  insert into public.workspaces(name, owner_id, plan)
  values (workspace_name, new.id, 'individual')
  returning id into new_workspace;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (new_workspace, new.id, 'admin')
  on conflict (workspace_id, user_id) do nothing;

  insert into public.profiles(id, workspace_id, name, email, company_name, role, plan)
  values (
    new.id,
    new_workspace,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    workspace_name,
    'admin',
    'individual'
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    company_name = excluded.company_name,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Entrada atômica pelo link: trava o workspace, confere validade e assentos,
-- vincula o usuário e só então contabiliza o uso do convite.
create or replace function public.accept_workspace_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_name text default '',
  p_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.workspace_invitations%rowtype;
  target_workspace public.workspaces%rowtype;
  existing_role text;
  member_count integer;
  plan_limit integer;
  was_already_member boolean;
begin
  if p_user_id is null or not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'Sessão inválida.' using errcode = 'P0001';
  end if;

  select * into invitation
  from public.workspace_invitations
  where token_hash = p_token_hash
  for update;

  if not found then raise exception 'Convite não encontrado.' using errcode = 'P0001'; end if;
  if invitation.expires_at < now() then raise exception 'Este convite expirou.' using errcode = 'P0001'; end if;

  select * into target_workspace
  from public.workspaces
  where id = invitation.workspace_id
  for update;

  if not found then raise exception 'Workspace não encontrado.' using errcode = 'P0001'; end if;

  select wm.role into existing_role
  from public.workspace_members wm
  where wm.workspace_id = invitation.workspace_id and wm.user_id = p_user_id;
  was_already_member := existing_role is not null;

  if not was_already_member then
    if invitation.uses_count >= invitation.max_uses then
      raise exception 'Este convite atingiu o limite de entradas.' using errcode = 'P0001';
    end if;
    if invitation.email is not null and lower(invitation.email) <> lower(coalesce(p_email, '')) then
      raise exception 'Este convite foi criado para outro e-mail.' using errcode = 'P0001';
    end if;

    plan_limit := case target_workspace.plan
      when 'studio' then 10
      when 'empresa' then 25
      when 'agencia' then 50
      else 1
    end;

    select count(*)::integer into member_count
    from public.workspace_members wm where wm.workspace_id = invitation.workspace_id;

    if member_count >= plan_limit then
      raise exception 'Esta equipe atingiu o limite de % usuário(s) do plano atual.', plan_limit using errcode = 'P0001';
    end if;

    insert into public.workspace_members(workspace_id, user_id, role)
    values (invitation.workspace_id, p_user_id, invitation.role);
    existing_role := invitation.role;

    update public.workspace_invitations
    set uses_count = uses_count + 1, accepted_by = p_user_id, accepted_at = now()
    where id = invitation.id;
  end if;

  insert into public.profiles(id, workspace_id, name, email, company_name, role, plan, updated_at)
  values (
    p_user_id,
    invitation.workspace_id,
    coalesce(nullif(p_name, ''), split_part(coalesce(p_email, ''), '@', 1), ''),
    coalesce(p_email, ''),
    target_workspace.name,
    existing_role,
    'individual',
    now()
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    company_name = excluded.company_name,
    role = excluded.role,
    updated_at = now();

  insert into public.team_members(
    id, workspace_id, name, email, role, access_level, avatar, projects_count, status
  ) values (
    'tm_' || p_user_id::text,
    invitation.workspace_id,
    coalesce(nullif(p_name, ''), split_part(coalesce(p_email, ''), '@', 1), 'Membro'),
    coalesce(p_email, ''),
    coalesce(nullif(invitation.job_title, ''), 'Membro da equipe'),
    existing_role,
    '',
    0,
    'ativo'
  )
  on conflict (workspace_id, id) do update set
    name = excluded.name,
    email = excluded.email,
    access_level = excluded.access_level,
    status = 'ativo';

  return jsonb_build_object(
    'joined', true,
    'alreadyMember', was_already_member,
    'workspaceId', invitation.workspace_id,
    'workspaceName', target_workspace.name,
    'role', existing_role
  );
end;
$$;

revoke all on function public.accept_workspace_invitation(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.accept_workspace_invitation(text, uuid, text, text) to service_role;

-- O frontend grava entidade por entidade; desativa a RPC antiga que substituía
-- todo o workspace e podia apagar dados ao receber um snapshot vazio.
do $$
begin
  if to_regprocedure('public.sync_workspace(jsonb)') is not null then
    revoke all on function public.sync_workspace(jsonb) from public, anon, authenticated;
  end if;
end $$;

-- RLS: cada usuário enxerga somente o workspace ativo. Convites permanecem
-- acessíveis exclusivamente pelas APIs server-side com service_role.
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_invitations enable row level security;

do $$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('workspaces','workspace_members','profiles','workspace_invitations')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

create policy workspace_active_read on public.workspaces
for select to authenticated
using (id = public.current_workspace_id() and public.is_workspace_member(id));

create policy workspace_members_read on public.workspace_members
for select to authenticated
using (
  user_id = auth.uid()
  or (workspace_id = public.current_workspace_id() and public.is_workspace_admin())
);

create policy workspace_members_admin_insert on public.workspace_members
for insert to authenticated
with check (workspace_id = public.current_workspace_id() and public.is_workspace_admin());

create policy workspace_members_admin_update on public.workspace_members
for update to authenticated
using (workspace_id = public.current_workspace_id() and public.is_workspace_admin())
with check (workspace_id = public.current_workspace_id() and public.is_workspace_admin());

create policy workspace_members_admin_delete on public.workspace_members
for delete to authenticated
using (workspace_id = public.current_workspace_id() and public.is_workspace_admin());

create policy profiles_own_read on public.profiles
for select to authenticated using (id = auth.uid());

create policy profiles_own_update on public.profiles
for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

revoke all on public.workspace_invitations from anon, authenticated;

-- Corrige as políticas das tabelas do produto, sem exigir que todas existam.
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events','tasks','messages',
    'communications','timeline_events','team_members','integrations'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      foreach policy_name in array array[
        'workspace_member_all','workspace_member_select','workspace_manager_insert',
        'workspace_manager_update','workspace_manager_delete','workspace_member_insert',
        'workspace_member_update','workspace_member_delete','workspace_admin_insert',
        'workspace_admin_update','workspace_admin_delete'
      ] loop
        execute format('drop policy if exists %I on public.%I', policy_name, table_name);
      end loop;

      execute format(
        'create policy workspace_member_select on public.%I for select to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))',
        table_name
      );
    end if;
  end loop;

  foreach table_name in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('create policy workspace_manager_insert on public.%I for insert to authenticated with check (workspace_id = public.current_workspace_id() and public.is_workspace_manager())', table_name);
      execute format('create policy workspace_manager_update on public.%I for update to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_manager()) with check (workspace_id = public.current_workspace_id() and public.is_workspace_manager())', table_name);
      execute format('create policy workspace_manager_delete on public.%I for delete to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_manager())', table_name);
    end if;
  end loop;

  foreach table_name in array array['tasks','messages','communications','timeline_events'] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('create policy workspace_member_insert on public.%I for insert to authenticated with check (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', table_name);
      execute format('create policy workspace_member_update on public.%I for update to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id)) with check (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', table_name);
      execute format('create policy workspace_member_delete on public.%I for delete to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', table_name);
    end if;
  end loop;

  foreach table_name in array array['team_members','integrations'] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('create policy workspace_admin_insert on public.%I for insert to authenticated with check (workspace_id = public.current_workspace_id() and public.is_workspace_admin())', table_name);
      execute format('create policy workspace_admin_update on public.%I for update to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_admin()) with check (workspace_id = public.current_workspace_id() and public.is_workspace_admin())', table_name);
      execute format('create policy workspace_admin_delete on public.%I for delete to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_admin())', table_name);
    end if;
  end loop;
end $$;

commit;

-- O resultado esperado é: status = OK, todos os contadores = 0.
select
  case
    when count(*) filter (where p.id is null or wm.user_id is null or w.id is null) = 0 then 'OK'
    else 'REVISAR'
  end as status,
  count(*) filter (where p.id is null) as contas_sem_perfil,
  count(*) filter (where wm.user_id is null) as contas_sem_membership,
  count(*) filter (where w.id is null) as contas_sem_workspace
from auth.users u
left join public.profiles p on p.id = u.id
left join public.workspace_members wm on wm.user_id = u.id and wm.workspace_id = p.workspace_id
left join public.workspaces w on w.id = p.workspace_id;
