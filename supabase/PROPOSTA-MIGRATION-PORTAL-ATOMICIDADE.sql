-- NÃO EXECUTAR SEM APROVAÇÃO.
-- Esta migration habilita as duas proteções exigidas pelo Portal:
-- 1) rate limit compartilhado entre instâncias serverless;
-- 2) mudança de status e comentário de aprovação na mesma transação.

create table if not exists public.client_portal_login_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.client_portal_login_rate_limits enable row level security;
revoke all on table public.client_portal_login_rate_limits from public, anon, authenticated;

create or replace function public.consume_client_portal_login_attempt(
  p_bucket_key text,
  p_limit integer default 8,
  p_window_seconds integer default 900
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.client_portal_login_rate_limits;
  now_value timestamptz := now();
begin
  if p_bucket_key is null or length(trim(p_bucket_key)) = 0 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.client_portal_login_rate_limits(bucket_key, window_started_at, attempts, updated_at)
  values (p_bucket_key, now_value, 1, now_value)
  on conflict (bucket_key) do update set
    window_started_at = case when public.client_portal_login_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value then now_value else public.client_portal_login_rate_limits.window_started_at end,
    attempts = case when public.client_portal_login_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value then 1 else public.client_portal_login_rate_limits.attempts + 1 end,
    blocked_until = case
      when public.client_portal_login_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value then null
      when public.client_portal_login_rate_limits.attempts + 1 > p_limit then now_value + make_interval(secs => p_window_seconds)
      else public.client_portal_login_rate_limits.blocked_until
    end,
    updated_at = now_value
  returning * into current_row;

  return current_row.attempts <= p_limit and (current_row.blocked_until is null or current_row.blocked_until <= now_value);
end;
$$;

revoke all on function public.consume_client_portal_login_attempt(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_client_portal_login_attempt(text, integer, integer) to service_role;

create or replace function public.apply_client_portal_approval_action(
  p_workspace_id uuid,
  p_project_id text,
  p_client_id text,
  p_approval_id uuid,
  p_action text,
  p_comment text,
  p_author text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.approval_requests%rowtype;
  next_status text;
  now_value timestamptz := now();
begin
  if p_action not in ('approve', 'reject', 'needs_revision', 'comment') then
    raise exception 'invalid approval action' using errcode = '22023';
  end if;
  if coalesce(length(p_comment), 0) > 4000 then
    raise exception 'comment too long' using errcode = '22023';
  end if;

  select * into current_request
  from public.approval_requests
  where id = p_approval_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id
    and client_id = p_client_id
  for update;

  if not found then raise exception 'approval request not found' using errcode = 'P0002'; end if;
  if current_request.status in ('approved', 'rejected') then raise exception 'approval request already finalized' using errcode = 'P0001'; end if;

  if p_action <> 'comment' then
    next_status := case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'needs_revision' end;
    update public.approval_requests
    set status = next_status,
        reviewed_at = now_value,
        reviewed_by = p_author,
        feedback_notes = case when p_action = 'approve' then nullif(p_comment, '') else feedback_notes end,
        rejection_reason = case when p_action = 'reject' then nullif(p_comment, '') else rejection_reason end,
        revision_notes = case when p_action = 'needs_revision' then nullif(p_comment, '') else revision_notes end
    where id = p_approval_id;
  end if;

  if coalesce(length(trim(p_comment)), 0) > 0 or p_action = 'comment' then
    insert into public.approval_comments (
      id, workspace_id, approval_request_id, author, author_role, comment_role,
      timestamp_value, text_value, content, resolved
    ) values (
      gen_random_uuid(), p_workspace_id, p_approval_id, p_author, 'cliente', 'cliente',
      now_value, p_comment, p_comment, false
    );
  end if;
end;
$$;

revoke all on function public.apply_client_portal_approval_action(uuid, text, text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.apply_client_portal_approval_action(uuid, text, text, uuid, text, text, text) to service_role;
