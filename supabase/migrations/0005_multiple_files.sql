-- ===========================================================================
-- 0005 — multiple files per homework task and per submission (up to 5)
-- ---------------------------------------------------------------------------
-- Adds array columns alongside the existing single-file columns. Old rows keep
-- working: readers fall back to attachment_url / answer when the array is null.
-- Safe to re-run.
-- ===========================================================================

-- Teacher's task files (FILE homework). Was a single attachment_url.
alter table public.homework
  add column if not exists attachment_urls text[];

-- Student's submitted files (FILE homework). Was stored in `answer`.
alter table public.homework_submissions
  add column if not exists attachment_urls text[];
