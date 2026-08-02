-- ===========================================================================
-- 0014_item_submissions
-- Student answers + scores for material exercises (the player's persistence).
-- ===========================================================================

create table if not exists public.material_item_submissions (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  item_id      uuid not null references public.material_items (id) on delete cascade,
  answer       jsonb not null default '{}'::jsonb,
  score        numeric(5, 2),
  submitted_at timestamptz not null default now(),
  unique (student_id, item_id)
);

create index if not exists material_item_submissions_student_id_idx on public.material_item_submissions (student_id);
create index if not exists material_item_submissions_item_id_idx on public.material_item_submissions (item_id);

alter table public.material_item_submissions enable row level security;
