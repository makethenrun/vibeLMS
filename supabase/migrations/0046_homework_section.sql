-- ===========================================================================
-- 0046_homework_section
-- Every material has a "Домашние задания" section: created automatically with
-- the material, always pinned last, and protected from move/rename/delete.
-- Marked by material_sections.is_homework.
-- ===========================================================================

alter table public.material_sections
  add column if not exists is_homework boolean not null default false;

-- Backfill: give every material that lacks one a homework section at the end.
insert into public.material_sections (material_id, title, position, is_homework)
select
  m.id,
  'Домашние задания',
  coalesce((select max(s.position) + 1 from public.material_sections s where s.material_id = m.id), 0),
  true
from public.materials m
where not exists (
  select 1 from public.material_sections s
  where s.material_id = m.id and s.is_homework = true
);
