-- ===========================================================================
-- 0018_item_retry
-- Let the tutor forbid re-taking an exercise. When false (default), a student
-- may press "Пройти заново" to clear their submission and answer again.
-- ===========================================================================

alter table public.material_items add column if not exists retry_disabled boolean not null default false;
