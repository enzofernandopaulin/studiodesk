begin;

-- A autorização deve respeitar o workspace ativo, não apenas qualquer membership.
-- Esta migration também remove a policy legada que permitia DML amplo em memberships.
-- Recria o helper caso a migration 20260907_priority_zero_security não tenha
-- sido aplicada no ambiente. A assinatura precisa ser exatamente uuid, text[].
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
    execute format('create policy "workspace_member_select" on public.%I for select to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events'
  ] loop
    execute format('create policy "workspace_manager_insert" on public.%I for insert to authenticated with check (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin'',''gestor'']))', t);
    execute format('create policy "workspace_manager_update" on public.%I for update to authenticated using (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin'',''gestor''])) with check (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin'',''gestor'']))', t);
    execute format('create policy "workspace_manager_delete" on public.%I for delete to authenticated using (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin'',''gestor'']))', t);
  end loop;

  foreach t in array array['tasks','messages','communications','timeline_events'] loop
    execute format('create policy "workspace_member_insert" on public.%I for insert to authenticated with check (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_member_update" on public.%I for update to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id)) with check (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_member_delete" on public.%I for delete to authenticated using (workspace_id = public.current_workspace_id() and public.is_workspace_member(workspace_id))', t);
  end loop;

  foreach t in array array['team_members','integrations'] loop
    execute format('create policy "workspace_admin_insert" on public.%I for insert to authenticated with check (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin'']))', t);
    execute format('create policy "workspace_admin_update" on public.%I for update to authenticated using (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin''])) with check (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin'']))', t);
    execute format('create policy "workspace_admin_delete" on public.%I for delete to authenticated using (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array[''admin'']))', t);
  end loop;
end $$;

-- Memberships só podem ser administradas por administradores do workspace ativo.
drop policy if exists "workspace_member_all" on public.workspace_members;
drop policy if exists "workspace_member_self" on public.workspace_members;
drop policy if exists "workspace_admin_members_insert" on public.workspace_members;
drop policy if exists "workspace_admin_members_update" on public.workspace_members;
drop policy if exists "workspace_admin_members_delete" on public.workspace_members;
create policy "workspace_member_self" on public.workspace_members
  for select to authenticated
  using (user_id = auth.uid() or (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array['admin'])));
create policy "workspace_admin_members_insert" on public.workspace_members
  for insert to authenticated
  with check (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array['admin']));
create policy "workspace_admin_members_update" on public.workspace_members
  for update to authenticated
  using (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array['admin']))
  with check (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array['admin']));
create policy "workspace_admin_members_delete" on public.workspace_members
  for delete to authenticated
  using (workspace_id = public.current_workspace_id() and public.has_workspace_role(workspace_id, array['admin']));

-- O cliente não pode mudar identidade, papel, workspace ou plano por DML direto.
create or replace function public.protect_profile_membership_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare membership_role text;
begin
  if auth.role() = 'service_role' then return new; end if;
  new.id := old.id;
  new.email := old.email;
  new.plan := old.plan;
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
  return new;
end;
$$;

revoke execute on function public.has_workspace_role(uuid, text[]) from public, anon;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;

commit;
