-- ===========================================================================
-- Migration 0002 — lesson attendance
-- ---------------------------------------------------------------------------
-- Run ONCE in the Supabase SQL editor on an existing database. Idempotent.
-- A row means the student was present at the lesson.
-- ===========================================================================

create table if not exists public.lesson_attendance (
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);

create index if not exists lesson_attendance_lesson_id_idx on public.lesson_attendance (lesson_id);
create index if not exists lesson_attendance_student_id_idx on public.lesson_attendance (student_id);

alter table public.lesson_attendance enable row level security;
