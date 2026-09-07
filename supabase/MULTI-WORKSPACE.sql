-- Execute uma vez no SQL Editor do Supabase.
-- Permite uma conta em vários workspaces e mantém um workspace ativo no perfil.

alter table public.workspace_invitations
  add column if not exists invited_name text;

alter table public.workspace_invitations
  add column if not exists job_title text;

alter table public.workspaces
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.workspaces
  add column if not exists plan text not null default 'individual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspaces_plan_check'
  ) then
    alter table public.workspaces add constraint workspaces_plan_check
      check (plan in ('individual','solo','studio','empresa','agencia'));
  end if;
end $$;

with owners as (
  select distinct on (wm.workspace_id)
    wm.workspace_id,
    wm.user_id,
    coalesce(p.plan, 'individual') as plan
  from public.workspace_members wm
  left join public.profiles p on p.id = wm.user_id
  order by wm.workspace_id, (wm.role = 'admin') desc, wm.created_at asc
)
update public.workspaces w
set owner_id = coalesce(w.owner_id, owners.user_id),
    plan = case when w.plan = 'individual' then owners.plan else w.plan end
from owners
where owners.workspace_id = w.id;

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

drop trigger if exists protect_profile_membership_fields on public.profiles;
create trigger protect_profile_membership_fields
before update on public.profiles
for each row execute procedure public.protect_profile_membership_fields();
