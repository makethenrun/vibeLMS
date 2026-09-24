-- ===========================================================================
-- 0048_homework_module
-- Homework moves from a material-level section to a per-lesson module: every
-- lesson gets a "Домашние задания" module, created automatically, always last,
-- unnumbered, protected from move/rename/delete. Retires the homework SECTION
-- introduced in 0046.
-- ===========================================================================

alter table public.material_modules
  add column if not exists is_homework boolean not null default false;

-- Backfill: a homework module at the end of every lesson that lacks one.
insert into public.material_modules (lesson_id, title, position, is_homework)
select
  l.id,
  'Домашние задания',
  coalesce((select max(m.position) + 1 from public.material_modules m where m.lesson_id = l.id), 0),
  true
from public.material_lessons l
where not exists (
  select 1 from public.material_modules m
  where m.lesson_id = l.id and m.is_homework = true
);

-- Retire the old homework SECTION concept (auto-created, normally empty). This
-- cascades to any lessons/modules/items under it.
delete from public.material_sections where is_homework = true;
