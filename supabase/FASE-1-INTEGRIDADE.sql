-- StudioDesk — Fase 1: integridade de onboarding e conversão de lead
-- Execute uma única vez no SQL Editor do Supabase.

begin;

create or replace function public.complete_studiodesk_onboarding(
  p_name text,
  p_avatar text,
  p_plan text,
  p_business_type text,
  p_team_size text,
  p_objectives jsonb,
  p_template text,
  p_columns jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wid uuid;
  membership_role text;
  column_item jsonb;
  column_count integer;
begin
  if uid is null then
    raise exception 'Sessão inválida.' using errcode = 'P0001';
  end if;

  select p.workspace_id into wid from public.profiles p where p.id = uid;
  select wm.role into membership_role
  from public.workspace_members wm
  where wm.workspace_id = wid and wm.user_id = uid;

  if wid is null or membership_role is null then
    raise exception 'Workspace ativo não encontrado.' using errcode = 'P0001';
  end if;

  column_count := jsonb_array_length(coalesce(p_columns, '[]'::jsonb));
  if column_count < 1 or column_count > 20 then
    raise exception 'O modelo do Kanban precisa ter entre 1 e 20 colunas.' using errcode = 'P0001';
  end if;

  update public.profiles
  set name = left(coalesce(p_name, ''), 160),
      avatar = left(coalesce(p_avatar, ''), 2000),
      plan = case when p_plan in ('individual','solo','studio','empresa','agencia') then p_plan else plan end,
      business_type = left(coalesce(p_business_type, ''), 120),
      team_size = left(coalesce(p_team_size, ''), 60),
      objectives = coalesce(p_objectives, '[]'::jsonb),
      template = left(coalesce(p_template, ''), 120),
      updated_at = now()
  where id = uid;

  if not found then
    raise exception 'Perfil não encontrado.' using errcode = 'P0001';
  end if;

  if membership_role not in ('admin', 'gestor') then
    raise exception 'Sem permissão para configurar o Kanban.' using errcode = 'P0001';
  end if;

  delete from public.kanban_columns where workspace_id = wid;
  for column_item in select value from jsonb_array_elements(p_columns)
  loop
    if nullif(trim(column_item->>'id'), '') is null or nullif(trim(column_item->>'title'), '') is null then
      raise exception 'Coluna do Kanban inválida.' using errcode = 'P0001';
    end if;
    insert into public.kanban_columns(id, workspace_id, title, color, sort_order)
    values (
      left(column_item->>'id', 120),
      wid,
      left(column_item->>'title', 160),
      left(coalesce(nullif(column_item->>'color', ''), '#66acd7'), 20),
      coalesce(nullif(column_item->>'order', '')::integer, 0)
    );
  end loop;

  return jsonb_build_object('completed', true, 'workspaceId', wid);
end;
$$;

revoke all on function public.complete_studiodesk_onboarding(text,text,text,text,text,jsonb,text,jsonb) from public, anon;
grant execute on function public.complete_studiodesk_onboarding(text,text,text,text,text,jsonb,text,jsonb) to authenticated;

create or replace function public.convert_lead_to_client(
  p_lead_id text,
  p_client jsonb,
  p_project jsonb default null,
  p_event jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wid uuid;
  membership_role text;
begin
  if uid is null then raise exception 'Sessão inválida.' using errcode = 'P0001'; end if;
  select p.workspace_id into wid from public.profiles p where p.id = uid;
  select wm.role into membership_role from public.workspace_members wm
  where wm.workspace_id = wid and wm.user_id = uid;
  if membership_role not in ('admin','gestor') then
    raise exception 'Sem permissão para converter leads.' using errcode = 'P0001';
  end if;

  update public.leads set status = 'convertido'
  where workspace_id = wid and id = p_lead_id and status <> 'convertido';
  if not found then
    raise exception 'Lead não encontrado ou já convertido.' using errcode = 'P0001';
  end if;

  insert into public.clients(
    id, workspace_id, name, company, email, phone, whatsapp, website, position,
    segment, assigned_to, status, notes, tags, created_at, lead_origin_id
  ) values (
    p_client->>'id', wid, p_client->>'name', coalesce(p_client->>'company',''),
    coalesce(p_client->>'email',''), coalesce(p_client->>'phone',''),
    coalesce(p_client->>'whatsapp',''), nullif(p_client->>'website',''),
    nullif(p_client->>'position',''), coalesce(p_client->>'segment',''),
    coalesce(p_client->>'assigned_to',''), coalesce(p_client->>'status','ativo'),
    nullif(p_client->>'notes',''), coalesce(p_client->'tags','[]'::jsonb),
    coalesce((p_client->>'created_at')::timestamptz, now()), p_lead_id
  );

  if p_project is not null then
    insert into public.projects(
      id, workspace_id, title, client_id, description, assigned_to, assigned_avatar,
      start_date, deadline, priority, status, column_id, tags, budget, progress, created_at
    ) values (
      p_project->>'id', wid, p_project->>'title', p_client->>'id',
      coalesce(p_project->>'description',''), coalesce(p_project->>'assigned_to',''),
      nullif(p_project->>'assigned_avatar',''), nullif(p_project->>'start_date','')::date,
      nullif(p_project->>'deadline','')::date, coalesce(p_project->>'priority','media'),
      coalesce(p_project->>'status',''), nullif(p_project->>'column_id',''),
      coalesce(p_project->'tags','[]'::jsonb), nullif(p_project->>'budget','')::numeric,
      coalesce(nullif(p_project->>'progress','')::integer, 0),
      coalesce((p_project->>'created_at')::timestamptz, now())
    );
  end if;

  if p_event is not null then
    insert into public.timeline_events(
      id, workspace_id, timestamp_value, time_string, actor, actor_avatar,
      action, details, category, reference_id
    ) values (
      p_event->>'id', wid, coalesce((p_event->>'timestamp_value')::timestamptz, now()),
      coalesce(p_event->>'time_string',''), coalesce(p_event->>'actor',''),
      nullif(p_event->>'actor_avatar',''), coalesce(p_event->>'action',''),
      nullif(p_event->>'details',''), coalesce(p_event->>'category','cliente'),
      nullif(p_event->>'reference_id','')
    );
  end if;

  return jsonb_build_object('converted', true, 'clientId', p_client->>'id', 'workspaceId', wid);
end;
$$;

revoke all on function public.convert_lead_to_client(text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.convert_lead_to_client(text,jsonb,jsonb,jsonb) to authenticated;

create or replace function public.create_workspace_for_user(p_user_id uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  created_workspace public.workspaces%rowtype;
  selected_plan text;
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuário inválido.' using errcode = 'P0001';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception 'Informe o nome do workspace.' using errcode = 'P0001';
  end if;

  select case when plan in ('individual','solo','studio','empresa','agencia') then plan else 'individual' end
  into selected_plan from public.profiles where id = p_user_id;

  insert into public.workspaces(name, owner_id, plan)
  values (left(trim(p_name), 120), p_user_id, coalesce(selected_plan, 'individual'))
  returning * into created_workspace;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (created_workspace.id, p_user_id, 'admin');

  update public.profiles
  set workspace_id = created_workspace.id,
      company_name = created_workspace.name,
      role = 'admin',
      updated_at = now()
  where id = p_user_id;

  return jsonb_build_object('id', created_workspace.id, 'name', created_workspace.name, 'plan', created_workspace.plan);
end;
$$;

revoke all on function public.create_workspace_for_user(uuid,text) from public, anon, authenticated;
grant execute on function public.create_workspace_for_user(uuid,text) to service_role;

commit;
