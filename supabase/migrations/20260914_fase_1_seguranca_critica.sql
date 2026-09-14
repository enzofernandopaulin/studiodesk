-- Fase 1: bloqueios críticos de segurança.
revoke all on function public.sync_workspace(jsonb) from public, anon, authenticated;
drop function if exists public.sync_workspace(jsonb);
create or replace function public.protect_profile_membership_fields()
returns trigger language plpgsql security definer set search_path=public as $$
declare membership_role text;
begin
 select wm.role into membership_role from public.workspace_members wm where wm.user_id=old.id and wm.workspace_id=new.workspace_id limit 1;
 new.id:=old.id; new.plan:=old.plan;
 if membership_role is null then new.workspace_id:=old.workspace_id; new.role:=old.role; else new.role:=membership_role; end if;
 return new;
end; $$;
drop trigger if exists protect_profile_membership_fields on public.profiles;
create trigger protect_profile_membership_fields before update on public.profiles for each row execute procedure public.protect_profile_membership_fields();
update public.workspace_invitations set expires_at=now(),max_uses=uses_count where role='admin' and uses_count<max_uses;
alter table public.workspace_invitations drop constraint if exists workspace_invitations_link_role_check;
alter table public.workspace_invitations add constraint workspace_invitations_link_role_check check(role in ('gestor','colaborador'));
