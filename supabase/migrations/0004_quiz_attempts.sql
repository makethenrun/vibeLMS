-- ===========================================================================
-- Migration 0004 — quiz attempt history + attempt limit
-- ---------------------------------------------------------------------------
-- Run ONCE in the Supabase SQL editor on an existing database. Idempotent.
--
--   * homework.max_attempts — limit on quiz attempts (NULL = unlimited).
--   * quiz_attempts — full history of a student's quiz attempts.
-- ===========================================================================

alter table public.homework
  add column if not exists max_attempts integer;

create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  attempt_no  integer not null,
  answers     text,
  score       numeric(5, 2),
  created_at  timestamptz not null default now()
);

create index if not exists quiz_attempts_homework_student_idx
  on public.quiz_attempts (homework_id, student_id);

alter table public.quiz_attempts enable row level security;
