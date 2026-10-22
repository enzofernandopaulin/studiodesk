begin;

-- Corrige a perda do plano escolhido no onboarding.
-- A função anterior recebia p_plan, mas não o persistia em profiles.
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
  normalized_plan text;
  column_item jsonb;
  column_count integer;
begin
  if uid is null then
    raise exception 'Sessão inválida.' using errcode = 'P0001';
  end if;

  select p.workspace_id into wid
  from public.profiles p
  where p.id = uid;

  select wm.role into membership_role
  from public.workspace_members wm
  where wm.workspace_id = wid
    and wm.user_id = uid;

  if wid is null or membership_role is null then
    raise exception 'Workspace ativo não encontrado.' using errcode = 'P0001';
  end if;

  normalized_plan := case
    when p_plan in ('individual', 'solo', 'studio', 'empresa', 'agencia') then p_plan
    else null
  end;

  column_count := jsonb_array_length(coalesce(p_columns, '[]'::jsonb));
  if column_count < 1 or column_count > 20 then
    raise exception 'O modelo do Kanban precisa ter entre 1 e 20 colunas.' using errcode = 'P0001';
  end if;

  update public.profiles
  set name = left(coalesce(p_name, ''), 160),
      avatar = left(coalesce(p_avatar, ''), 2000),
      plan = coalesce(normalized_plan, plan),
      business_type = left(coalesce(p_business_type, ''), 120),
      team_size = left(coalesce(p_team_size, ''), 60),
      objectives = coalesce(p_objectives, '[]'::jsonb),
      template = left(coalesce(p_template, ''), 120),
      updated_at = now()
  where id = uid;

  if not found then
    raise exception 'Perfil não encontrado.' using errcode = 'P0001';
  end if;

  -- O workspace é a fonte de verdade para limites de equipe e capacidade.
  -- Atualiza apenas o workspace cujo dono está concluindo o próprio onboarding.
  update public.workspaces
  set plan = coalesce(normalized_plan, plan),
      updated_at = now()
  where id = wid
    and owner_id = uid;

  if membership_role not in ('admin', 'gestor') then
    raise exception 'Sem permissão para configurar o Kanban.' using errcode = 'P0001';
  end if;

  delete from public.kanban_columns
  where workspace_id = wid;

  for column_item in select value from jsonb_array_elements(p_columns)
  loop
    if nullif(trim(column_item->>'id'), '') is null
       or nullif(trim(column_item->>'title'), '') is null then
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

  return jsonb_build_object(
    'completed', true,
    'workspaceId', wid,
    'plan', coalesce(normalized_plan, (select p.plan from public.profiles p where p.id = uid))
  );
end;
$$;

revoke all on function public.complete_studiodesk_onboarding(text, text, text, text, text, jsonb, text, jsonb)
from public, anon;
grant execute on function public.complete_studiodesk_onboarding(text, text, text, text, text, jsonb, text, jsonb)
to authenticated;

commit;
