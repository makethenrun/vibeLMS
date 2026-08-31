-- ===========================================================================
-- 0032_session_lesson_link
-- Link a live session to the scheduled calendar lesson it was run for, so the
-- history can show planned lessons as conducted / not conducted / cancelled and
-- ad-hoc sessions as unplanned.
-- ===========================================================================

alter table public.live_sessions add column if not exists lesson_id uuid references public.lessons (id) on delete set null;
