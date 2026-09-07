-- StudioDesk — diretório profissional de equipe
-- Pré-requisito: CORRECAO-WORKSPACES-E-CONVITES.sql já executado.
-- Execute este arquivo inteiro no SQL Editor. Não apaga dados do CRM.

begin;

do $$
begin
  if to_regclass('public.workspaces') is null
     or to_regclass('public.workspace_members') is null
     or to_regclass('public.profiles') is null
     or to_regclass('public.team_members') is null then
    raise exception 'Estrutura base ausente. Execute primeiro CORRECAO-WORKSPACES-E-CONVITES.sql.';
  end if;
end $$;

-- workspace_members é a fonte oficial de autorização. team_members é somente
-- o diretório visual, mantido automaticamente por estes gatilhos.
create or replace function public.sync_team_directory_from_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
begin
  if tg_op = 'DELETE' then
    delete from public.team_members
    where workspace_id = old.workspace_id and id = 'tm_' || old.user_id::text;
    return old;
  end if;

  select * into profile_row from public.profiles where id = new.user_id;
  insert into public.team_members(
    id, workspace_id, name, email, role, access_level, avatar, projects_count, status
  ) values (
    'tm_' || new.user_id::text,
    new.workspace_id,
    coalesce(nullif(profile_row.name, ''), nullif(split_part(coalesce(profile_row.email, ''), '@', 1), ''), 'Membro'),
    coalesce(profile_row.email, ''),
    case when new.role = 'admin' then 'Administrador' when new.role = 'gestor' then 'Gestor' else 'Membro da equipe' end,
    new.role,
    coalesce(profile_row.avatar, ''),
    0,
    'ativo'
  )
  on conflict (workspace_id, id) do update set
    name = case when excluded.name <> 'Membro' then excluded.name else public.team_members.name end,
    email = case when excluded.email <> '' then excluded.email else public.team_members.email end,
    access_level = excluded.access_level,
    avatar = case when excluded.avatar <> '' then excluded.avatar else public.team_members.avatar end,
    status = 'ativo';
  return new;
end;
$$;

drop trigger if exists sync_team_directory_membership on public.workspace_members;
create trigger sync_team_directory_membership
after insert or update of role or delete on public.workspace_members
for each row execute procedure public.sync_team_directory_from_membership();

create or replace function public.sync_team_directory_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.team_members tm
  set name = coalesce(nullif(new.name, ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), tm.name),
      email = coalesce(nullif(new.email, ''), tm.email),
      avatar = coalesce(nullif(new.avatar, ''), tm.avatar)
  from public.workspace_members wm
  where wm.user_id = new.id
    and tm.workspace_id = wm.workspace_id
    and tm.id = 'tm_' || new.id::text;
  return new;
end;
$$;

drop trigger if exists sync_team_directory_profile on public.profiles;
create trigger sync_team_directory_profile
after insert or update of name, email, avatar on public.profiles
for each row execute procedure public.sync_team_directory_from_profile();

-- Reconcilia agora quem já entrou antes desta correção.
insert into public.team_members(
  id, workspace_id, name, email, role, access_level, avatar, projects_count, status
)
select
  'tm_' || wm.user_id::text,
  wm.workspace_id,
  coalesce(nullif(p.name, ''), nullif(split_part(coalesce(p.email, ''), '@', 1), ''), 'Membro'),
  coalesce(p.email, ''),
  case
    when w.owner_id = wm.user_id then 'Proprietário'
    when wm.role = 'admin' then 'Administrador'
    when wm.role = 'gestor' then 'Gestor'
    else 'Membro da equipe'
  end,
  wm.role,
  coalesce(p.avatar, ''),
  0,
  'ativo'
from public.workspace_members wm
join public.workspaces w on w.id = wm.workspace_id
left join public.profiles p on p.id = wm.user_id
on conflict (workspace_id, id) do update set
  name = excluded.name,
  email = excluded.email,
  access_level = excluded.access_level,
  avatar = excluded.avatar,
  status = 'ativo';

-- Remoção atômica: encerra o acesso e garante que a pessoa continue com pelo
-- menos um workspace válido, sem deixá-la presa numa sessão inconsistente.
create or replace function public.remove_workspace_member(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_target_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_row public.workspaces%rowtype;
  fallback_membership public.workspace_members%rowtype;
  fallback_workspace_name text;
  personal_workspace_id uuid;
  target_plan text;
begin
  select * into workspace_row from public.workspaces
  where id = p_workspace_id for update;
  if not found then raise exception 'Workspace não encontrado.' using errcode = 'P0001'; end if;

  if not exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_actor_user_id and role = 'admin'
  ) then
    raise exception 'Somente administradores podem remover membros.' using errcode = 'P0001';
  end if;
  if p_actor_user_id = p_target_user_id then
    raise exception 'Você não pode remover sua própria conta por esta tela.' using errcode = 'P0001';
  end if;
  if workspace_row.owner_id = p_target_user_id then
    raise exception 'O proprietário do workspace não pode ser removido.' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_target_user_id
  ) then
    raise exception 'Esse usuário não pertence ao workspace.' using errcode = 'P0001';
  end if;

  delete from public.workspace_members
  where workspace_id = p_workspace_id and user_id = p_target_user_id;

  if exists (
    select 1 from public.profiles
    where id = p_target_user_id and workspace_id = p_workspace_id
  ) then
    select * into fallback_membership
    from public.workspace_members
    where user_id = p_target_user_id
    order by (role = 'admin') desc, created_at asc
    limit 1;

    if fallback_membership.workspace_id is null then
      select case when plan in ('individual','solo','studio','empresa','agencia') then plan else 'individual' end
      into target_plan from public.profiles where id = p_target_user_id;
      insert into public.workspaces(name, owner_id, plan)
      values ('Meu Workspace', p_target_user_id, coalesce(target_plan, 'individual'))
      returning id into personal_workspace_id;
      insert into public.workspace_members(workspace_id, user_id, role)
      values (personal_workspace_id, p_target_user_id, 'admin')
      returning * into fallback_membership;
    end if;

    select name into fallback_workspace_name from public.workspaces
    where id = fallback_membership.workspace_id;
    update public.profiles
    set workspace_id = fallback_membership.workspace_id,
        company_name = fallback_workspace_name,
        role = fallback_membership.role,
        updated_at = now()
    where id = p_target_user_id;
  end if;

  return jsonb_build_object('removed', true, 'userId', p_target_user_id);
end;
$$;

revoke all on function public.remove_workspace_member(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid, uuid) to service_role;

commit;

-- Esperado: registros_faltando_no_diretorio = 0.
select count(*) as registros_faltando_no_diretorio
from public.workspace_members wm
left join public.team_members tm
  on tm.workspace_id = wm.workspace_id and tm.id = 'tm_' || wm.user_id::text
where tm.id is null;
