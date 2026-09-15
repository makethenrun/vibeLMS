-- ===========================================================================
-- 0043_material_language
-- Each material has an optional "study language", chosen on the material page
-- from the list of languages configured in Settings (settings.languages).
-- ===========================================================================

alter table public.materials add column if not exists language text;

alter table public.settings add column if not exists languages jsonb not null default '[]'::jsonb;
