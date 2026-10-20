-- Run once in the Supabase SQL Editor before enabling RECAP_ADMIN_AUTH_ENABLED.
-- Keys are HMAC digests, not raw IP addresses.
create table if not exists public.recap_admin_login_attempts (
  key text primary key,
  window_started_at timestamptz not null,
  attempts integer not null check (attempts >= 0)
);
alter table public.recap_admin_login_attempts enable row level security;
revoke all on table public.recap_admin_login_attempts from public, anon, authenticated;
grant select, insert, update, delete on table public.recap_admin_login_attempts to service_role;

create or replace function public.recap_login_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_attempts integer;
begin
  if p_key is null or p_key !~ '^[a-f0-9]{64}$'
    or p_limit < 1 or p_limit > 1000
    or p_window_seconds < 60 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.recap_admin_login_attempts as a (key, window_started_at, attempts)
  values (p_key, now(), 1)
  on conflict (key) do update
    set attempts = case
      when a.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1 else a.attempts + 1 end,
        window_started_at = case
      when a.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now() else a.window_started_at end
  returning attempts into current_attempts;
  return current_attempts <= p_limit;
end;
$$;
revoke all on function public.recap_login_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.recap_login_rate_limit(text, integer, integer) to service_role;

-- Optional maintenance, e.g. weekly: delete from public.recap_admin_login_attempts where window_started_at < now() - interval '2 days';
