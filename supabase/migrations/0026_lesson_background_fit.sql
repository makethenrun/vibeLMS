-- ===========================================================================
-- 0026_lesson_background_fit
-- How the lesson background is displayed: fit (cover / contain / tile),
-- vertical position, and a scale (%) used for the tile mode — so the picture
-- doesn't get stretched or misaligned.
-- ===========================================================================

alter table public.material_lessons add column if not exists background_fit text not null default 'cover';
alter table public.material_lessons add column if not exists background_position text not null default 'center';
alter table public.material_lessons add column if not exists background_scale integer not null default 100;
