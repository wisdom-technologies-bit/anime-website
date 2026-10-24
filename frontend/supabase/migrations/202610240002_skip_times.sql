create table if not exists public.skip_times (
  anilist_id integer not null,
  episode integer not null,
  found boolean not null,
  op_start real,
  op_end real,
  ed_start real,
  ed_end real,
  recap_start real,
  recap_end real,
  episode_length real,
  fetched_at timestamptz not null default now(),
  primary key (anilist_id, episode)
);
alter table public.skip_times enable row level security;
create policy "skip times are publicly readable" on public.skip_times for select to anon, authenticated using (true);
