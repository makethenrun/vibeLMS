-- ===========================================================================
-- 0042_lesson_adjustments
-- Manual corrections to a student's lesson balance. A student's remaining
-- lessons = paid lessons (confirmed payments) + sum(adjustments.delta) − lessons
-- consumed (past, non-cancelled lessons of the student's groups). A tutor uses a
-- positive delta to credit a lesson back (e.g. a lesson that shouldn't count) or
-- a negative delta to debit one.
-- ===========================================================================

create table if not exists public.lesson_adjustments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  delta      integer not null,
  comment    text,
  created_at timestamptz not null default now()
);

create index if not exists lesson_adjustments_student_id_idx on public.lesson_adjustments (student_id);

alter table public.lesson_adjustments enable row level security;
