-- ===========================================================================
-- 0038_administrator_role
-- New user role ADMINISTRATOR: oversight + limited management (grants access,
-- adds students to groups) but cannot edit materials.
-- ===========================================================================

alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('TUTOR', 'STUDENT', 'ASSISTANT', 'ADMINISTRATOR'));
