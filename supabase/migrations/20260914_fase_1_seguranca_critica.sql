-- Fase 1: bloqueios críticos de segurança.
-- Pode ser executada mais de uma vez.
begin;

do $$
declare signature text;
begin
  for signature in
    select p.oid::regprocedure::text
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='sync_workspace'
  loop
    execute format('drop function %s',signature);
  end loop;
end $$;

create or replace function public.protect_profile_membership_fields()
returns trigger language plpgsql security definer set search_path=public as $$
declare membership_role text;
begin
  select wm.role into membership_role
  from public.workspace_members wm
  where wm.user_id=old.id and wm.workspace_id=new.workspace_id
  limit 1;

  new.id:=old.id;
  new.plan:=old.plan;
  if membership_role is null then
    new.workspace_id:=old.workspace_id;
    new.role:=old.role;
  else
    new.role:=membership_role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_membership_fields on public.profiles;
create trigger protect_profile_membership_fields
before update on public.profiles
for each row execute procedure public.protect_profile_membership_fields();

-- Convites administrativos compartilháveis são eliminados. Administradores
-- continuam sendo promovidos apenas por uma ação autenticada específica.
delete from public.workspace_invitations where role='admin';

do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conrelid='public.workspace_invitations'::regclass
      and conname='workspace_invitations_link_role_check'
  ) then
    alter table public.workspace_invitations
      add constraint workspace_invitations_link_role_check
      check(role in ('gestor','colaborador'));
  end if;
end $$;

commit;
