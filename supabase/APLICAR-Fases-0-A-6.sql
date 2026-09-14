-- StudioDesk — atualização consolidada das Fases 0 a 6
-- Gerado em 2026-09-14.
--
-- Fase 0: CI/documentação, sem alteração no banco.
-- Fase 1: segurança.
-- Fase 2: integridade e índices.
-- Fase 3: bootstrap transacional.
-- Fases 4 e 5: frontend/consultas, sem alteração estrutural adicional.
-- Fase 6: avatar/storage.
--
-- Execute primeiro em staging e faça backup antes da produção.
-- O script é idempotente e roda em uma única transação.

begin;

create table if not exists public.studiodesk_schema_migrations(
  version text primary key,
  description text not null,
  applied_at timestamptz not null default now()
);

-- ============================================================
-- FASE 1 — SEGURANÇA
-- ============================================================
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

-- ============================================================
-- FASE 2 — INTEGRIDADE E ÍNDICES
-- ============================================================
do $$
declare fk_name text;
begin
  select c.conname into fk_name
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  join pg_attribute a on a.attrelid=t.oid and a.attnum=any(c.conkey)
  where n.nspname='public' and t.relname='profiles'
    and a.attname='workspace_id' and c.contype='f'
  limit 1;
  if fk_name is not null then
    execute format('alter table public.profiles drop constraint %I',fk_name);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_workspace_id_fkey
  foreign key(workspace_id) references public.workspaces(id)
  on delete set null not valid;

do $$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.messages'::regclass and conname='messages_workspace_client_fkey') then
    alter table public.messages add constraint messages_workspace_client_fkey
      foreign key(workspace_id,client_id) references public.clients(workspace_id,id) on delete cascade not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.messages'::regclass and conname='messages_workspace_project_fkey') then
    alter table public.messages add constraint messages_workspace_project_fkey
      foreign key(workspace_id,project_id) references public.projects(workspace_id,id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.messages'::regclass and conname='messages_workspace_task_fkey') then
    alter table public.messages add constraint messages_workspace_task_fkey
      foreign key(workspace_id,task_id) references public.tasks(workspace_id,id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.approval_comments'::regclass and conname='comments_workspace_media_fkey') then
    alter table public.approval_comments add constraint comments_workspace_media_fkey
      foreign key(workspace_id,media_approval_id) references public.media_approvals(workspace_id,id) on delete cascade not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.approval_comments'::regclass and conname='comments_workspace_approval_fkey') then
    alter table public.approval_comments add constraint comments_workspace_approval_fkey
      foreign key(workspace_id,approval_request_id) references public.approval_requests(workspace_id,id) on delete cascade not valid;
  end if;
end $$;

create index if not exists leads_workspace_created_idx on public.leads(workspace_id,created_at desc,id);
create index if not exists clients_workspace_created_idx on public.clients(workspace_id,created_at desc,id);
create index if not exists projects_workspace_created_idx on public.projects(workspace_id,created_at desc,id);
create index if not exists tasks_workspace_created_idx on public.tasks(workspace_id,created_at desc,id);
create index if not exists timeline_workspace_timestamp_idx on public.timeline_events(workspace_id,timestamp_value desc,id);
create index if not exists deliverables_workspace_project_idx on public.project_deliverables(workspace_id,project_id);
create index if not exists media_workspace_project_idx on public.media_approvals(workspace_id,project_id);
create index if not exists comments_workspace_media_idx on public.approval_comments(workspace_id,media_approval_id);
create index if not exists memberships_user_workspace_idx on public.workspace_members(user_id,workspace_id);
create index if not exists invitations_token_idx on public.workspace_invitations(token_hash);

-- Corrige owner_id ausente em workspaces antigos usando o primeiro admin.
update public.workspaces w
set owner_id=owners.user_id,updated_at=now()
from (
  select distinct on(workspace_id) workspace_id,user_id
  from public.workspace_members
  where role='admin'
  order by workspace_id,created_at,user_id
) owners
where w.id=owners.workspace_id and w.owner_id is null;

-- ============================================================
-- FASE 3 — BOOTSTRAP TRANSACIONAL
-- ============================================================
create or replace function public.bootstrap_studiodesk_user(
  p_user_id uuid,p_name text,p_email text,p_company_name text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  target_workspace_id uuid;
  target_role text;
  target_name text;
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
    select name into target_name
    from public.workspaces where id=target_workspace_id for share;
  end if;

  if target_name is null then raise exception 'Workspace inválido.'; end if;

  insert into public.profiles(
    id,workspace_id,name,email,company_name,role,plan,updated_at
  ) values(
    p_user_id,target_workspace_id,
    coalesce(nullif(trim(p_name),''),nullif(split_part(p_email,'@',1),''),'Usuário'),
    coalesce(p_email,''),target_name,target_role,'individual',now()
  )
  on conflict(id) do update set
    workspace_id=excluded.workspace_id,
    name=case when trim(public.profiles.name)='' then excluded.name else public.profiles.name end,
    email=case when trim(public.profiles.email)='' then excluded.email else public.profiles.email end,
    company_name=excluded.company_name,
    role=excluded.role,
    updated_at=now();

  return jsonb_build_object('ready',true,'workspaceId',target_workspace_id);
end;
$$;

revoke all on function public.bootstrap_studiodesk_user(uuid,text,text,text)
from public,anon,authenticated;
grant execute on function public.bootstrap_studiodesk_user(uuid,text,text,text)
to service_role;

-- ============================================================
-- FASE 6 — AVATAR E STORAGE
-- ============================================================
alter table public.profiles
  add column if not exists avatar text not null default '';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'studiodesk-avatars','studiodesk-avatars',true,5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "studiodesk_avatar_insert_own" on storage.objects;
create policy "studiodesk_avatar_insert_own"
on storage.objects for insert to authenticated
with check(
  bucket_id='studiodesk-avatars'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists "studiodesk_avatar_update_own" on storage.objects;
create policy "studiodesk_avatar_update_own"
on storage.objects for update to authenticated
using(
  bucket_id='studiodesk-avatars'
  and (storage.foldername(name))[1]=auth.uid()::text
)
with check(
  bucket_id='studiodesk-avatars'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists "studiodesk_avatar_delete_own" on storage.objects;
create policy "studiodesk_avatar_delete_own"
on storage.objects for delete to authenticated
using(
  bucket_id='studiodesk-avatars'
  and (storage.foldername(name))[1]=auth.uid()::text
);

insert into public.studiodesk_schema_migrations(version,description)
values('20260914-fases-0-6','Segurança, integridade, bootstrap e storage')
on conflict(version) do update set description=excluded.description;

commit;

-- Diagnóstico: todas as linhas devem retornar ok=true.
select 'sync_workspace removida' as verificacao,
  not exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='sync_workspace'
  ) as ok
union all
select 'proteção do perfil',
  exists(select 1 from pg_trigger where tgname='protect_profile_membership_fields' and not tgisinternal)
union all
select 'bootstrap transacional',
  to_regprocedure('public.bootstrap_studiodesk_user(uuid,text,text,text)') is not null
union all
select 'avatar no perfil',
  exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='avatar'
  )
union all
select 'migration registrada',
  exists(
    select 1 from public.studiodesk_schema_migrations
    where version='20260914-fases-0-6'
  );
