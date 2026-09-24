-- ===========================================================================
-- 0050_assistant_create_materials_per_user
-- Per-assistant permission to create materials (managed on the Assistants tab),
-- replacing the global Settings flag from 0049. Off by default.
-- ===========================================================================

alter table public.users
  add column if not exists can_create_materials boolean not null default false;
