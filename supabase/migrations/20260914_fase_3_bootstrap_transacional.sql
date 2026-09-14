-- Fase 3: bootstrap transacional.
create or replace function public.bootstrap_studiodesk_user(
  p_user_id uuid, p_name text, p_email text, p_company_name text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  target_workspace_id uuid; target_role text; target_name text;
begin
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then
    raise exception 'Sessão inválida.';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select wm.workspace_id,wm.role into target_workspace_id,target_role
  from public.workspace_members wm
  left join public.profiles p on p.id=p_user_id
  where wm.user_id=p_user_id
  order by (wm.workspace_id=p.workspace_id) desc,wm.created_at
  limit 1;

  if target_workspace_id is null then
    insert into public.workspaces(name,owner_id,plan)
    values(coalesce(nullif(trim(p_company_name),''),'Meu Workspace'),p_user_id,'individual')
    returning id,name into target_workspace_id,target_name;
    insert into public.workspace_members(workspace_id,user_id,role)
    values(target_workspace_id,p_user_id,'admin');
    target_role:='admin';
  else
    select name into target_name from public.workspaces where id=target_workspace_id for share;
  end if;

  if target_name is null then raise exception 'Workspace inválido.'; end if;

  insert into public.profiles(id,workspace_id,name,email,company_name,role,plan,updated_at)
  values(p_user_id,target_workspace_id,
    coalesce(nullif(trim(p_name),''),split_part(p_email,'@',1)),
    coalesce(p_email,''),target_name,target_role,'individual',now())
  on conflict(id) do update set
    workspace_id=excluded.workspace_id,
    name=case when trim(public.profiles.name)='' then excluded.name else public.profiles.name end,
    email=case when trim(public.profiles.email)='' then excluded.email else public.profiles.email end,
    company_name=excluded.company_name,role=excluded.role,updated_at=now();

  return jsonb_build_object('ready',true,'workspaceId',target_workspace_id);
end; $$;
revoke all on function public.bootstrap_studiodesk_user(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.bootstrap_studiodesk_user(uuid,text,text,text) to service_role;
