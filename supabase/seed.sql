-- ===========================================================================
-- pLMS — optional demo seed data
-- ---------------------------------------------------------------------------
-- Inserts a couple of demo students and a group so the dashboard is not empty
-- right after you register your first tutor account.
--
-- NOTE: This file does NOT create login accounts. Passwords must be bcrypt
-- hashed by the application, so create your first TUTOR account through the
-- app's /register page. Student login accounts are created from the UI.
--
-- Run AFTER schema.sql. Idempotent-ish (guarded by name lookups).
-- ===========================================================================

-- Demo group
insert into public.groups (name)
select 'Английский — Beginners'
where not exists (select 1 from public.groups where name = 'Английский — Beginners');

-- Demo students
insert into public.students (full_name, notes)
select 'Иван Петров', 'Демонстрационный ученик'
where not exists (select 1 from public.students where full_name = 'Иван Петров');

insert into public.students (full_name, notes)
select 'Мария Сидорова', 'Демонстрационный ученик'
where not exists (select 1 from public.students where full_name = 'Мария Сидорова');

-- Link demo students to the demo group
insert into public.group_members (group_id, student_id)
select g.id, s.id
from public.groups g
cross join public.students s
where g.name = 'Английский — Beginners'
  and s.full_name in ('Иван Петров', 'Мария Сидорова')
on conflict (group_id, student_id) do nothing;
