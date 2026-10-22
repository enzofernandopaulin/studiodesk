begin;

-- Persiste a escolha de plano assim que o usuário a confirma no onboarding.
-- O plano não depende de estado local do navegador.
create or replace function public.set_studiodesk_plan(p_plan text)
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
begin
  if uid is null then
    raise exception 'Sessão inválida.' using errcode = 'P0001';
  end if;

  normalized_plan := case
    when p_plan in ('individual', 'solo', 'studio', 'empresa', 'agencia') then p_plan
    else null
  end;

  if normalized_plan is null then
    raise exception 'Plano inválido.' using errcode = 'P0001';
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

  if membership_role not in ('admin', 'gestor') then
    raise exception 'Sem permissão para alterar o plano.' using errcode = 'P0001';
  end if;

  update public.profiles
  set plan = normalized_plan,
      updated_at = now()
  where id = uid;

  if not found then
    raise exception 'Perfil não encontrado.' using errcode = 'P0001';
  end if;

  update public.workspaces
  set plan = normalized_plan,
      updated_at = now()
  where id = wid
    and owner_id = uid;

  return jsonb_build_object(
    'updated', true,
    'plan', normalized_plan,
    'workspaceId', wid
  );
end;
$$;

revoke all on function public.set_studiodesk_plan(text) from public, anon;
grant execute on function public.set_studiodesk_plan(text) to authenticated;

commit;
