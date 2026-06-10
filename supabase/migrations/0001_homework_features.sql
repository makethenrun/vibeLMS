-- ===========================================================================
-- Migration 0001 — homework features
-- ---------------------------------------------------------------------------
-- Run this ONCE in the Supabase SQL editor on an EXISTING database (one that
-- was already created from the original schema.sql). Fresh installs already
-- include these columns via schema.sql. Idempotent.
--
-- Adds:
--   * homework.attachment_url  — optional task file for FILE homework
--   * quiz_questions.options   — choices for multiple-choice questions
--                                (NULL/empty => free-text question)
-- ===========================================================================

alter table public.homework
  add column if not exists attachment_url text;

alter table public.quiz_questions
  add column if not exists options text[];
