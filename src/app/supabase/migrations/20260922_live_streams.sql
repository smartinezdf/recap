create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  club text not null,
  court text not null,
  device_name text not null,
  desired_state text not null default 'stopped' check (desired_state in ('live', 'stopped')),
  actual_state text not null default 'stopped' check (actual_state in ('stopped', 'starting', 'live', 'stopping', 'error')),
  youtube_url text,
  duration_minutes integer not null default 120 check (duration_minutes between 5 and 720),
  heartbeat_at timestamptz,
  started_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club, court)
);

alter table public.live_streams enable row level security;

insert into public.live_streams (club, court, device_name)
values
  ('Saque Padel Club', 'Cancha 1', 'recap-saquepadel1'),
  ('Saque Padel Club', 'Cancha 2', 'recap-saquepadel1')
on conflict (club, court) do nothing;
