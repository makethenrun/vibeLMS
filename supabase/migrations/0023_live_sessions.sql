-- ===========================================================================
-- 0023_live_sessions
-- Live tutoring sessions: a tutor drives a group through a material in real
-- time — switching everyone to an exercise, drawing over it, and watching
-- results. One active (ended_at is null) session per group at a time.
-- ===========================================================================

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  active_item_id uuid references public.material_items (id) on delete set null,
  drawing text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);

create unique index if not exists live_sessions_one_active_per_group
  on public.live_sessions (group_id)
  where ended_at is null;

-- RLS on, no policies = deny-all for anon/authenticated keys. The app uses the
-- service-role key (which bypasses RLS), matching every other table here.
alter table public.live_sessions enable row level security;
