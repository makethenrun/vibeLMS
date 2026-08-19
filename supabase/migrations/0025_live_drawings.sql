-- ===========================================================================
-- 0025_live_drawings
-- (1) focused_item_id: the exercise the tutor "pinned" — students scroll to it
--     while still seeing the whole lesson.
-- (2)/(3) live_drawings: per-exercise drawings by the tutor and by each student,
--     so the tutor's strokes show to students live and the tutor can watch a
--     student's strokes. author_key = 'tutor' or the student's id.
-- ===========================================================================

alter table public.live_sessions add column if not exists focused_item_id uuid references public.material_items (id) on delete set null;

create table if not exists public.live_drawings (
  session_id uuid not null references public.live_sessions (id) on delete cascade,
  item_id uuid not null references public.material_items (id) on delete cascade,
  author_key text not null,
  student_id uuid references public.students (id) on delete cascade,
  drawing text,
  updated_at timestamptz not null default now(),
  primary key (session_id, item_id, author_key)
);

alter table public.live_drawings enable row level security;
