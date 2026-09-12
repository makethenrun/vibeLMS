-- ===========================================================================
-- 0040_settings_keyboards
-- Which optional "extra keyboards" (symbol palettes) are enabled org-wide.
-- Defaults to IPA so the existing helper stays available.
-- ===========================================================================

alter table public.settings add column if not exists enabled_keyboards jsonb not null default '["ipa"]'::jsonb;
