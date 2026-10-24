create table if not exists public.provider_health (
  provider text primary key,
  ok_count integer not null default 0,
  fail_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  last_fail_at timestamptz,
  last_fail_reason text
);
alter table public.provider_health enable row level security;

revoke all on public.provider_health from anon, authenticated;

