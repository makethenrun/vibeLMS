-- ===========================================================================
-- 0049_assistant_create_materials
-- Permission (tutor-controlled, in Settings) for whether assistants may create
-- their own materials. Off by default.
-- ===========================================================================

alter table public.settings
  add column if not exists assistants_can_create_materials boolean not null default false;
