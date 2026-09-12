-- ===========================================================================
-- 0039_lesson_series
-- Groups lessons created together as a recurring series so the whole series
-- can be managed (deleted) at once. NULL = a one-off lesson.
-- ===========================================================================

alter table public.lessons add column if not exists series_id uuid;
create index if not exists lessons_series_id_idx on public.lessons (series_id);
