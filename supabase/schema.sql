-- StudioDesk — Fase 2: banco relacional Serverless com Supabase
-- Execute este arquivo no SQL Editor do Supabase.
-- A Fase 2 remove o workspace JSONB e normaliza o domínio principal.

create extension if not exists pgcrypto;

-- ============================================================
-- WORKSPACES / USUÁRIOS
-- ============================================================
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Agência',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  avatar text not null default '',
  role text not null default 'admin',
  plan text not null default 'individual',
  business_type text not null default '',
  team_size text not null default '',
  objectives jsonb not null default '[]'::jsonb,
  template text not null default 'Audiovisual',
  company_name text not null default 'Minha Agência',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CRM
-- ============================================================
create table if not exists public.leads (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  source text not null default 'Outro',
  service_interest text not null default '',
  assigned_to text not null default '',
  notes text not null default '',
  status text not null default 'novo',
  created_at timestamptz not null default now(),
  value numeric,
  primary key (workspace_id, id)
);

create table if not exists public.clients (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  website text,
  position text,
  segment text not null default '',
  assigned_to text not null default '',
  status text not null default 'ativo',
  notes text,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  lead_origin_id text,
  primary key (workspace_id, id)
);

create table if not exists public.kanban_columns (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  color text not null default '#66acd7',
  sort_order integer not null default 0,
  primary key (workspace_id, id)
);

create table if not exists public.projects (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  client_id text,
  description text not null default '',
  assigned_to text not null default '',
  assigned_avatar text,
  start_date date,
  deadline date,
  priority text not null default 'media',
  status text not null default '',
  column_id text,
  tags jsonb not null default '[]'::jsonb,
  budget numeric,
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (workspace_id, id),
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id) on delete set null
);

create table if not exists public.project_deliverables (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id text not null,
  title text not null,
  version text not null default 'V01',
  file_url text,
  file_type text not null default 'doc',
  submitted_at timestamptz,
  status text not null default 'aguardando_aprovacao',
  feedback_notes text,
  reviewed_at timestamptz,
  reviewed_by text,
  primary key (workspace_id, id),
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id) on delete cascade
);

create table if not exists public.media_approvals (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id text not null,
  title text not null,
  version text not null default 'V01',
  video_url text,
  thumbnail_url text,
  status text not null default 'pendente',
  primary key (workspace_id, id),
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id) on delete cascade
);

create table if not exists public.approval_comments (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  media_approval_id text,
  approval_request_id text,
  author text not null default '',
  author_role text,
  comment_role text,
  timestamp_value timestamptz not null default now(),
  timecode text,
  text_value text,
  content text,
  resolved boolean not null default false,
  primary key (workspace_id, id)
);

create table if not exists public.approval_requests (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  client_id text,
  project_id text,
  assigned_to text not null default '',
  assigned_avatar text,
  category text not null default 'outro',
  created_at timestamptz not null default now(),
  due_date date,
  status text not null default 'pending',
  priority text not null default 'media',
  file_url text,
  file_type text,
  feedback_notes text,
  rejection_reason text,
  revision_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  primary key (workspace_id, id),
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id) on delete set null,
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id) on delete set null
);

create table if not exists public.calendar_events (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  date_value date not null,
  start_time time not null,
  end_time time not null,
  client_id text,
  assigned_to text not null default '',
  assigned_avatar text,
  type text not null default 'other',
  status text not null default 'scheduled',
  notes text,
  location_or_link text,
  created_at timestamptz not null default now(),
  primary key (workspace_id, id),
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id) on delete set null
);

create table if not exists public.tasks (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  project_id text,
  client_id text,
  assigned_to text not null default '',
  assigned_avatar text,
  deadline date,
  priority text not null default 'media',
  description text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (workspace_id, id),
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id) on delete set null,
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id) on delete set null
);

-- ============================================================
-- COMUNICAÇÃO / AUDITORIA / EQUIPE / INTEGRAÇÕES
-- ============================================================
create table if not exists public.messages (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sender text not null default 'user',
  sender_name text not null default '',
  content text not null default '',
  timestamp_value text not null default '',
  client_id text,
  project_id text,
  task_id text,
  media_type text not null default 'text',
  media_url text,
  primary key (workspace_id, id)
);

create table if not exists public.communications (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text,
  project_id text,
  channel text not null default 'interno',
  sender text not null default '',
  content text not null default '',
  status text not null default 'enviado',
  timestamp_value text not null default '',
  primary key (workspace_id, id),
  foreign key (workspace_id, client_id) references public.clients(workspace_id, id) on delete set null,
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id) on delete set null
);

create table if not exists public.timeline_events (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  timestamp_value timestamptz not null default now(),
  time_string text not null default '',
  actor text not null default '',
  actor_avatar text,
  action text not null default '',
  details text,
  category text not null default 'projeto',
  reference_id text,
  primary key (workspace_id, id)
);

create table if not exists public.team_members (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text not null default '',
  role text not null default '',
  access_level text not null default 'colaborador',
  avatar text not null default '',
  projects_count integer not null default 0,
  status text not null default 'ativo',
  primary key (workspace_id, id)
);

create table if not exists public.integrations (
  id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  category text not null default '',
  description text not null default '',
  status text not null default 'preparado',
  connected_at timestamptz,
  icon_name text not null default '',
  details text,
  primary key (workspace_id, id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists leads_workspace_status_idx on public.leads(workspace_id, status);
create index if not exists clients_workspace_status_idx on public.clients(workspace_id, status);
create index if not exists projects_workspace_column_idx on public.projects(workspace_id, column_id);
create index if not exists tasks_workspace_deadline_idx on public.tasks(workspace_id, deadline);
create index if not exists approval_requests_workspace_status_idx on public.approval_requests(workspace_id, status);
create index if not exists timeline_workspace_timestamp_idx on public.timeline_events(workspace_id, timestamp_value desc);

-- ============================================================
-- RLS
-- ============================================================
create or replace function public.is_workspace_member(target_workspace uuid)
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
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.projects enable row level security;
alter table public.project_deliverables enable row level security;
alter table public.media_approvals enable row level security;
alter table public.approval_comments enable row level security;
alter table public.approval_requests enable row level security;
alter table public.calendar_events enable row level security;
alter table public.tasks enable row level security;
alter table public.messages enable row level security;
alter table public.communications enable row level security;
alter table public.timeline_events enable row level security;
alter table public.team_members enable row level security;
alter table public.integrations enable row level security;

-- Políticas simples e idempotentes por tabela.
do $$
declare
  t text;
begin
  foreach t in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events','tasks','messages',
    'communications','timeline_events','team_members','integrations'
  ] loop
    execute format('drop policy if exists "workspace_member_all" on public.%I', t);
    execute format('create policy "workspace_member_all" on public.%I for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

drop policy if exists "workspace_member_read" on public.workspaces;
create policy "workspace_member_read" on public.workspaces for select to authenticated using (public.is_workspace_member(id));

drop policy if exists "workspace_member_self" on public.workspace_members;
create policy "workspace_member_self" on public.workspace_members for select to authenticated using (user_id = auth.uid());

drop policy if exists "profiles_own_workspace" on public.profiles;
create policy "profiles_own_workspace" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================
-- NOVO USUÁRIO: workspace + membership + profile
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace uuid;
  workspace_name text;
begin
  workspace_name := coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'Minha Agência');

  insert into public.workspaces(name)
  values (workspace_name)
  returning id into new_workspace;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (new_workspace, new.id, 'admin')
  on conflict do nothing;

  insert into public.profiles (id, workspace_id, name, email, company_name, role)
  values (
    new.id,
    new_workspace,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    workspace_name,
    'admin'
  )
  on conflict (id) do update set workspace_id = excluded.workspace_id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ============================================================
-- MIGRAÇÃO DE USUÁRIOS EXISTENTES DA FASE 1
-- ============================================================
do $$
declare
  p record;
  w uuid;
begin
  for p in select * from public.profiles where workspace_id is null loop
    insert into public.workspaces(name)
    values (coalesce(nullif(p.company_name, ''), 'Minha Agência'))
    returning id into w;

    insert into public.workspace_members(workspace_id, user_id, role)
    values (w, p.id, coalesce(p.role, 'admin'))
    on conflict do nothing;

    update public.profiles
    set workspace_id = w, updated_at = now()
    where id = p.id;
  end loop;
end $$;

-- ============================================================
-- RPC TRANSACIONAL PARA SINCRONIZAR O SNAPSHOT NORMALIZADO
-- A aplicação ainda trabalha com seus tipos atuais, mas o banco
-- deixa de guardar o domínio inteiro em uma coluna JSONB.
-- ============================================================
create or replace function public.sync_workspace(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wid uuid;
  item jsonb;
  d jsonb;
begin
  if uid is null then raise exception 'Não autenticado'; end if;
  select workspace_id into wid from public.profiles where id = uid;
  if wid is null or not public.is_workspace_member(wid) then raise exception 'Workspace não encontrado'; end if;

  delete from public.approval_comments where workspace_id = wid;
  delete from public.media_approvals where workspace_id = wid;
  delete from public.project_deliverables where workspace_id = wid;
  delete from public.approval_requests where workspace_id = wid;
  delete from public.tasks where workspace_id = wid;
  delete from public.messages where workspace_id = wid;
  delete from public.communications where workspace_id = wid;
  delete from public.calendar_events where workspace_id = wid;
  delete from public.timeline_events where workspace_id = wid;
  delete from public.projects where workspace_id = wid;
  delete from public.clients where workspace_id = wid;
  delete from public.leads where workspace_id = wid;
  delete from public.kanban_columns where workspace_id = wid;
  delete from public.team_members where workspace_id = wid;
  delete from public.integrations where workspace_id = wid;

  for item in select * from jsonb_array_elements(coalesce(payload->'kanbanColumns','[]'::jsonb)) loop
    insert into public.kanban_columns(id,workspace_id,title,color,sort_order)
    values(item->>'id',wid,coalesce(item->>'title',''),coalesce(item->>'color','#66acd7'),coalesce((item->>'order')::int,0));
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'leads','[]'::jsonb)) loop
    insert into public.leads(id,workspace_id,name,company,email,phone,whatsapp,source,service_interest,assigned_to,notes,status,created_at,value)
    values(item->>'id',wid,coalesce(item->>'name',''),coalesce(item->>'company',''),coalesce(item->>'email',''),coalesce(item->>'phone',''),coalesce(item->>'whatsapp',''),coalesce(item->>'source','Outro'),coalesce(item->>'serviceInterest',''),coalesce(item->>'assignedTo',''),coalesce(item->>'notes',''),coalesce(item->>'status','novo'),coalesce((item->>'createdAt')::timestamptz,now()),nullif(item->>'value','')::numeric);
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'clients','[]'::jsonb)) loop
    insert into public.clients(id,workspace_id,name,company,email,phone,whatsapp,website,position,segment,assigned_to,status,notes,tags,created_at,lead_origin_id)
    values(item->>'id',wid,coalesce(item->>'name',''),coalesce(item->>'company',''),coalesce(item->>'email',''),coalesce(item->>'phone',''),coalesce(item->>'whatsapp',''),item->>'website',item->>'position',coalesce(item->>'segment',''),coalesce(item->>'assignedTo',''),coalesce(item->>'status','ativo'),item->>'notes',coalesce(item->'tags','[]'::jsonb),coalesce((item->>'createdAt')::timestamptz,now()),item->>'leadOriginId');
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'projects','[]'::jsonb)) loop
    insert into public.projects(id,workspace_id,title,client_id,description,assigned_to,assigned_avatar,start_date,deadline,priority,status,column_id,tags,budget,progress,created_at)
    values(item->>'id',wid,coalesce(item->>'title',''),item->>'clientId',coalesce(item->>'description',''),coalesce(item->>'assignedTo',''),item->>'assignedAvatar',nullif(item->>'startDate','')::date,nullif(item->>'deadline','')::date,coalesce(item->>'priority','media'),coalesce(item->>'status',''),item->>'columnId',coalesce(item->'tags','[]'::jsonb),nullif(item->>'budget','')::numeric,coalesce((item->>'progress')::int,0),coalesce((item->>'createdAt')::timestamptz,now()));
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'projects','[]'::jsonb)) loop
    for d in select * from jsonb_array_elements(coalesce(item->'deliverables','[]'::jsonb)) loop
      insert into public.project_deliverables(id,workspace_id,project_id,title,version,file_url,file_type,submitted_at,status,feedback_notes,reviewed_at,reviewed_by)
      values(d->>'id',wid,item->>'id',coalesce(d->>'title',''),coalesce(d->>'version','V01'),d->>'fileUrl',coalesce(d->>'fileType','doc'),nullif(d->>'submittedAt','')::timestamptz,coalesce(d->>'status','aguardando_aprovacao'),d->>'feedbackNotes',nullif(d->>'reviewedAt','')::timestamptz,d->>'reviewedBy');
    end loop;
    if item ? 'mediaApproval' and item->'mediaApproval' is not null then
      insert into public.media_approvals(id,workspace_id,project_id,title,version,video_url,thumbnail_url,status)
      values(coalesce(item->'mediaApproval'->>'id','med_'||item->>'id'),wid,item->>'id',coalesce(item->'mediaApproval'->>'title',''),coalesce(item->'mediaApproval'->>'version','V01'),item->'mediaApproval'->>'videoUrl',item->'mediaApproval'->>'thumbnailUrl',coalesce(item->'mediaApproval'->>'status','pendente'));
      for d in select * from jsonb_array_elements(coalesce(item->'mediaApproval'->'comments','[]'::jsonb)) loop
        insert into public.approval_comments(id,workspace_id,media_approval_id,author,author_role,comment_role,timestamp_value,timecode,text_value,content,resolved)
        values(d->>'id',wid,coalesce(item->'mediaApproval'->>'id','med_'||item->>'id'),coalesce(d->>'author',''),d->>'authorRole',d->>'role',coalesce((d->>'timestamp')::timestamptz,now()),d->>'timecode',d->>'text',d->>'content',coalesce((d->>'resolved')::boolean,false));
      end loop;
    end if;
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'tasks','[]'::jsonb)) loop
    insert into public.tasks(id,workspace_id,title,project_id,client_id,assigned_to,assigned_avatar,deadline,priority,description,completed,completed_at,created_at)
    values(item->>'id',wid,coalesce(item->>'title',''),item->>'projectId',item->>'clientId',coalesce(item->>'assignedTo',''),item->>'assignedAvatar',nullif(item->>'deadline','')::date,coalesce(item->>'priority','media'),item->>'description',coalesce((item->>'completed')::boolean,false),nullif(item->>'completedAt','')::timestamptz,coalesce((item->>'createdAt')::timestamptz,now()));
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'calendarEvents','[]'::jsonb)) loop
    insert into public.calendar_events(id,workspace_id,title,description,date_value,start_time,end_time,client_id,assigned_to,assigned_avatar,type,status,notes,location_or_link,created_at)
    values(item->>'id',wid,coalesce(item->>'title',''),item->>'description',(item->>'date')::date,(item->>'startTime')::time,(item->>'endTime')::time,item->>'clientId',coalesce(item->>'assignedTo',''),item->>'assignedAvatar',coalesce(item->>'type','other'),coalesce(item->>'status','scheduled'),item->>'notes',item->>'locationOrLink',coalesce((item->>'createdAt')::timestamptz,now()));
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'approvalRequests','[]'::jsonb)) loop
    insert into public.approval_requests(id,workspace_id,title,description,client_id,project_id,assigned_to,assigned_avatar,category,created_at,due_date,status,priority,file_url,file_type,feedback_notes,rejection_reason,revision_notes,reviewed_by,reviewed_at)
    values(item->>'id',wid,coalesce(item->>'title',''),coalesce(item->>'description',''),item->>'clientId',item->>'projectId',coalesce(item->>'assignedTo',''),item->>'assignedAvatar',coalesce(item->>'category','outro'),coalesce((item->>'createdAt')::timestamptz,now()),nullif(item->>'dueDate','')::date,coalesce(item->>'status','pending'),coalesce(item->>'priority','media'),item->>'fileUrl',item->>'fileType',item->>'feedbackNotes',item->>'rejectionReason',item->>'revisionNotes',item->>'reviewedBy',nullif(item->>'reviewedAt','')::timestamptz);
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'messages','[]'::jsonb)) loop
    insert into public.messages(id,workspace_id,sender,sender_name,content,timestamp_value,client_id,project_id,task_id,media_type,media_url)
    values(item->>'id',wid,coalesce(item->>'sender','user'),coalesce(item->>'senderName',''),coalesce(item->>'content',''),coalesce(item->>'timestamp',''),item->>'clientId',item->>'projectId',item->>'taskId',coalesce(item->>'mediaType','text'),item->>'mediaUrl');
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'communications','[]'::jsonb)) loop
    insert into public.communications(id,workspace_id,client_id,project_id,channel,sender,content,status,timestamp_value)
    values(item->>'id',wid,item->>'clientId',item->>'projectId',coalesce(item->>'channel','interno'),coalesce(item->>'sender',''),coalesce(item->>'content',''),coalesce(item->>'status','enviado'),coalesce(item->>'timestamp',''));
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'timelineEvents','[]'::jsonb)) loop
    insert into public.timeline_events(id,workspace_id,timestamp_value,time_string,actor,actor_avatar,action,details,category,reference_id)
    values(item->>'id',wid,coalesce((item->>'timestamp')::timestamptz,now()),coalesce(item->>'timeString',''),coalesce(item->>'actor',''),item->>'actorAvatar',coalesce(item->>'action',''),item->>'details',coalesce(item->>'category','projeto'),item->>'referenceId');
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'team','[]'::jsonb)) loop
    insert into public.team_members(id,workspace_id,name,email,role,access_level,avatar,projects_count,status)
    values(item->>'id',wid,coalesce(item->>'name',''),coalesce(item->>'email',''),coalesce(item->>'role',''),coalesce(item->>'accessLevel','colaborador'),coalesce(item->>'avatar',''),coalesce((item->>'projectsCount')::int,0),coalesce(item->>'status','ativo'));
  end loop;

  for item in select * from jsonb_array_elements(coalesce(payload->'integrations','[]'::jsonb)) loop
    insert into public.integrations(id,workspace_id,name,category,description,status,connected_at,icon_name,details)
    values(item->>'id',wid,coalesce(item->>'name',''),coalesce(item->>'category',''),coalesce(item->>'description',''),coalesce(item->>'status','preparado'),nullif(item->>'connectedAt','')::timestamptz,coalesce(item->>'iconName',''),item->>'details');
  end loop;
end;
$$;

grant execute on function public.sync_workspace(jsonb) to authenticated;

-- ============================================================
-- FASE 4 — AUTENTICAÇÃO, PAPÉIS E AUTORIZAÇÃO
-- ============================================================
-- O papel real do usuário vem de workspace_members. O frontend
-- nunca deve conseguir promover a si mesmo alterando profiles.role.

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_workspace_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = public.current_workspace_id()
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_workspace_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_workspace_role() = 'admin';
$$;

create or replace function public.is_workspace_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_workspace_role() in ('admin','gestor');
$$;

-- Mantém campos de identidade/autorização do perfil sincronizados com membership.
create or replace function public.protect_profile_membership_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_role text;
  membership_workspace uuid;
begin
  select wm.workspace_id, wm.role into membership_workspace, membership_role
  from public.workspace_members wm
  where wm.user_id = old.id
  limit 1;

  new.workspace_id := coalesce(membership_workspace, old.workspace_id);
  new.role := coalesce(membership_role, old.role);
  new.id := old.id;
  return new;
end;
$$;

drop trigger if exists protect_profile_membership_fields on public.profiles;
create trigger protect_profile_membership_fields
before update on public.profiles
for each row execute procedure public.protect_profile_membership_fields();

-- Reforça as políticas: leitura para membros; mutação administrativa para
-- estrutura sensível; tarefas/comunicação/aprovações seguem operacionais.

do $$
declare t text;
begin
  foreach t in array array['leads','clients','kanban_columns','projects','project_deliverables','media_approvals','approval_comments','approval_requests','calendar_events','tasks','messages','communications','timeline_events','team_members','integrations'] loop
    execute format('drop policy if exists "workspace_member_all" on public.%I', t);
    execute format('drop policy if exists "workspace_member_select" on public.%I', t);
    execute format('drop policy if exists "workspace_manager_insert" on public.%I', t);
    execute format('drop policy if exists "workspace_manager_update" on public.%I', t);
    execute format('drop policy if exists "workspace_manager_delete" on public.%I', t);
  end loop;
end $$;

-- Todas as entidades podem ser lidas por membros do workspace.
do $$
declare t text;
begin
  foreach t in array array['leads','clients','kanban_columns','projects','project_deliverables','media_approvals','approval_comments','approval_requests','calendar_events','tasks','messages','communications','timeline_events','team_members','integrations'] loop
    execute format('create policy "workspace_member_select" on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

-- Gestão de CRM/projetos/estrutura por admin ou gestor.
do $$
declare t text;
begin
  foreach t in array array['leads','clients','kanban_columns','projects','project_deliverables','media_approvals','approval_comments','approval_requests','calendar_events'] loop
    execute format('create policy "workspace_manager_insert" on public.%I for insert to authenticated with check (public.is_workspace_manager() and public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_manager_update" on public.%I for update to authenticated using (public.is_workspace_manager() and public.is_workspace_member(workspace_id)) with check (public.is_workspace_manager() and public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_manager_delete" on public.%I for delete to authenticated using (public.is_workspace_manager() and public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

-- Operação diária também pode ser feita por colaborador.
do $$
declare t text;
begin
  foreach t in array array['tasks','messages','communications','timeline_events'] loop
    execute format('create policy "workspace_member_insert" on public.%I for insert to authenticated with check (public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_member_update" on public.%I for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', t);
    execute format('create policy "workspace_member_delete" on public.%I for delete to authenticated using (public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

-- Equipe e integrações são administrativas.
create policy "workspace_admin_insert" on public.team_members for insert to authenticated with check (public.is_workspace_admin() and public.is_workspace_member(workspace_id));
create policy "workspace_admin_update" on public.team_members for update to authenticated using (public.is_workspace_admin() and public.is_workspace_member(workspace_id)) with check (public.is_workspace_admin() and public.is_workspace_member(workspace_id));
create policy "workspace_admin_delete" on public.team_members for delete to authenticated using (public.is_workspace_admin() and public.is_workspace_member(workspace_id));
create policy "workspace_admin_insert" on public.integrations for insert to authenticated with check (public.is_workspace_admin() and public.is_workspace_member(workspace_id));
create policy "workspace_admin_update" on public.integrations for update to authenticated using (public.is_workspace_admin() and public.is_workspace_member(workspace_id)) with check (public.is_workspace_admin() and public.is_workspace_member(workspace_id));
create policy "workspace_admin_delete" on public.integrations for delete to authenticated using (public.is_workspace_admin() and public.is_workspace_member(workspace_id));

-- Só admin pode administrar memberships.
drop policy if exists "workspace_member_self" on public.workspace_members;
create policy "workspace_member_self" on public.workspace_members for select to authenticated using (user_id = auth.uid() or public.is_workspace_admin());
create policy "workspace_admin_members_insert" on public.workspace_members for insert to authenticated with check (public.is_workspace_admin());
create policy "workspace_admin_members_update" on public.workspace_members for update to authenticated using (public.is_workspace_admin()) with check (public.is_workspace_admin());
create policy "workspace_admin_members_delete" on public.workspace_members for delete to authenticated using (public.is_workspace_admin());

-- ============================================================
-- FASE 5 — STORAGE PRIVADO PARA ARQUIVOS DO WORKSPACE
-- ============================================================
-- Os objetos usam o primeiro segmento do caminho como workspace_id:
--   <workspace_id>/<categoria>/<user_id>/<uuid>-<arquivo>
-- O bucket é privado; o frontend gera signed URLs temporárias.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'studiodesk-files',
  'studiodesk-files',
  false,
  524288000,
  array[
    'video/mp4','video/webm','video/quicktime','video/x-msvideo',
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg','audio/wav','audio/ogg','text/plain'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  drop policy if exists "studiodesk_storage_select" on storage.objects;
  create policy "studiodesk_storage_select"
    on storage.objects for select to authenticated
    using (
      bucket_id = 'studiodesk-files'
      and split_part(name, '/', 1) = public.current_workspace_id()::text
      and public.is_workspace_member(public.current_workspace_id())
    );

  drop policy if exists "studiodesk_storage_insert" on storage.objects;
  create policy "studiodesk_storage_insert"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'studiodesk-files'
      and split_part(name, '/', 1) = public.current_workspace_id()::text
      and public.is_workspace_member(public.current_workspace_id())
    );

  drop policy if exists "studiodesk_storage_update" on storage.objects;
  create policy "studiodesk_storage_update"
    on storage.objects for update to authenticated
    using (
      bucket_id = 'studiodesk-files'
      and split_part(name, '/', 1) = public.current_workspace_id()::text
      and public.is_workspace_manager()
    )
    with check (
      bucket_id = 'studiodesk-files'
      and split_part(name, '/', 1) = public.current_workspace_id()::text
      and public.is_workspace_manager()
    );

  drop policy if exists "studiodesk_storage_delete" on storage.objects;
  create policy "studiodesk_storage_delete"
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'studiodesk-files'
      and split_part(name, '/', 1) = public.current_workspace_id()::text
      and public.is_workspace_manager()
    );
end $$;

-- ============================================================
-- FASE 6 — SUPABASE REALTIME
-- ============================================================
-- Um único canal do frontend escuta as entidades do workspace.
-- REPLICA IDENTITY FULL garante que eventos DELETE também carreguem
-- workspace_id no registro antigo, permitindo filtrar corretamente.
do $$
declare t text;
begin
  foreach t in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events','tasks','messages',
    'communications','timeline_events','team_members','integrations'
  ] loop
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'leads','clients','kanban_columns','projects','project_deliverables','media_approvals',
    'approval_comments','approval_requests','calendar_events','tasks','messages',
    'communications','timeline_events','team_members','integrations'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
