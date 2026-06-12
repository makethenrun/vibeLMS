-- ===========================================================================
-- Migration 0003 — multiple correct answers + per-question grading mode
-- ---------------------------------------------------------------------------
-- Run ONCE in the Supabase SQL editor on an existing database. Idempotent.
--
--   * quiz_questions.correct_answers — the set of correct options for a
--     CHOICE question (free-text questions keep using correct_answer).
--   * quiz_questions.grading — 'STRICT' (all-or-nothing) or 'PARTIAL'
--     (credit per correct option, minus wrong ones). Existing rows default
--     to 'STRICT'.
-- ===========================================================================

alter table public.quiz_questions
  add column if not exists correct_answers text[];

alter table public.quiz_questions
  add column if not exists grading text not null default 'STRICT';
