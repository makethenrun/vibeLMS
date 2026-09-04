-- ===========================================================================
-- 0036_assistant_profile
-- Assistants (users with role ASSISTANT) gain a profile like students:
-- a full name, free-form notes, and an archive flag.
-- ===========================================================================

alter table public.users add column if not exists full_name  text;
alter table public.users add column if not exists notes       text;
alter table public.users add column if not exists is_archived boolean not null default false;
