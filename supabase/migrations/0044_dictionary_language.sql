-- ===========================================================================
-- 0044_dictionary_language
-- Dictionaries are split per study language. Each entry carries the language it
-- belongs to (null = the legacy "Общий" dictionary). A user's set of dictionaries
-- is derived at read time (staff: all settings.languages; student: languages of
-- accessible materials plus any language they already have entries in — so a
-- dictionary is never lost when material access ends).
-- ===========================================================================

alter table public.dictionary_entries add column if not exists language text;

create index if not exists dictionary_entries_owner_lang_idx
  on public.dictionary_entries (owner_id, language);
