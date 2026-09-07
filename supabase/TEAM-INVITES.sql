-- Execute uma vez no SQL Editor do Supabase.
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  token_hash text not null unique,
  email text,
  role text not null default 'colaborador' check (role in ('admin','gestor','colaborador')),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  max_uses integer not null default 25 check (max_uses between 1 and 50),
  uses_count integer not null default 0 check (uses_count >= 0),
  created_at timestamptz not null default now()
);

alter table public.workspace_invitations add column if not exists max_uses integer not null default 25;
alter table public.workspace_invitations add column if not exists uses_count integer not null default 0;

create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations(workspace_id, created_at desc);

alter table public.workspace_invitations enable row level security;
-- Convites são manipulados apenas pelas funções server-side com service_role.
revoke all on public.workspace_invitations from anon, authenticated;
