-- NÃO EXECUTAR SEM APROVAÇÃO.
-- Necessária para substituir o limitador apenas em memória por um limite
-- compartilhado entre instâncias serverless da Vercel.

create table if not exists public.client_portal_login_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.client_portal_login_rate_limits enable row level security;
revoke all on table public.client_portal_login_rate_limits from anon, authenticated;

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
  allowed boolean;
begin
  if p_bucket_key is null or length(trim(p_bucket_key)) = 0 then
    return false;
  end if;

  insert into public.client_portal_login_rate_limits(bucket_key, window_started_at, attempts, blocked_until, updated_at)
  values (p_bucket_key, now_value, 1, null, now_value)
  on conflict (bucket_key) do update set
    window_started_at = case
      when public.client_portal_login_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value
      then now_value else public.client_portal_login_rate_limits.window_started_at end,
    attempts = case
      when public.client_portal_login_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value
      then 1 else public.client_portal_login_rate_limits.attempts + 1 end,
    blocked_until = case
      when public.client_portal_login_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value
      then null
      when public.client_portal_login_rate_limits.attempts + 1 > p_limit
      then now_value + make_interval(secs => p_window_seconds)
      else public.client_portal_login_rate_limits.blocked_until end,
    updated_at = now_value
  returning * into current_row;

  allowed := current_row.attempts <= p_limit and (current_row.blocked_until is null or current_row.blocked_until <= now_value);
  return allowed;
end;
$$;

revoke all on function public.consume_client_portal_login_attempt(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_client_portal_login_attempt(text, integer, integer) to service_role;
