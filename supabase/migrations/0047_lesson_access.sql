-- ===========================================================================
-- 0047_lesson_access
-- Per-group access rules for individual lessons. One row per (group, lesson);
-- absence of a row means OPEN (accessible by default).
--   mode = OPEN      -> always accessible
--   mode = DATE      -> accessible once now() >= available_at
--   mode = PROGRESS  -> accessible once the previous lesson is fully submitted
--   mode = MANUAL    -> accessible only when unlocked = true (tutor opens it)
-- ===========================================================================

create table if not exists public.lesson_access (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  lesson_id    uuid not null references public.material_lessons(id) on delete cascade,
  mode         text not null default 'OPEN' check (mode in ('OPEN', 'DATE', 'PROGRESS', 'MANUAL')),
  available_at timestamptz,
  unlocked     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (group_id, lesson_id)
);

create index if not exists lesson_access_group_idx on public.lesson_access (group_id);
create index if not exists lesson_access_lesson_idx on public.lesson_access (lesson_id);

alter table public.lesson_access enable row level security;
