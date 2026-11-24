-- Mantém a escolha comercial do plano no workspace, que é a fonte canônica.
begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace uuid;
  workspace_name text;
  selected_plan text;
begin
  workspace_name := left(coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), 'Minha Agência'), 120);
  selected_plan := case
    when new.raw_user_meta_data->>'plan' in ('solo','studio','empresa','agencia')
      then new.raw_user_meta_data->>'plan'
    when new.raw_user_meta_data->>'plan' = 'individual' then 'solo'
    else 'solo'
  end;

  insert into public.workspaces(name, owner_id, plan)
  values (workspace_name, new.id, selected_plan)
  returning id into new_workspace;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (new_workspace, new.id, 'admin')
  on conflict do nothing;

  insert into public.profiles(id, workspace_id, name, email, company_name, role, plan)
  values (
    new.id, new_workspace, coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''), workspace_name, 'admin', selected_plan
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    company_name = excluded.company_name,
    role = excluded.role,
    plan = excluded.plan,
    updated_at = now();

  return new;
end;
$$;

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
    set plan = case when new.plan = 'individual' then 'solo' else new.plan end,
        updated_at = now()
    where owner_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_owner_workspace_plan on public.profiles;
create trigger sync_owner_workspace_plan
after update of plan on public.profiles
for each row execute procedure public.sync_owner_workspace_plan();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_owner_workspace_plan() from public, anon, authenticated;

commit;
