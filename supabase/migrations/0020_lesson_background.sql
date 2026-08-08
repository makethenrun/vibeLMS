-- ===========================================================================
-- 0020_lesson_background
-- Optional decorative background per lesson, shown behind the module menu and
-- the exercise blocks. background_dim is a 0..80 percentage of a black overlay
-- used to lower the background brightness. NULL url = no background.
-- ===========================================================================

alter table public.material_lessons add column if not exists background_url text;
alter table public.material_lessons add column if not exists background_dim integer not null default 0;

-- Example: give the demo "Предложения" lesson a background out of the box.
update public.material_lessons
set background_url = '/backgrounds/sentences.svg', background_dim = 25
where title = 'Предложения' and background_url is null;
