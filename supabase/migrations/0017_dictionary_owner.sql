-- ===========================================================================
-- 0017_dictionary_owner
-- Make the dictionary per-user (each user has their own words).
-- Existing shared rows (owner NULL) are removed.
-- ===========================================================================

alter table public.dictionary_entries add column if not exists owner_id uuid references public.users (id) on delete cascade;

delete from public.dictionary_entries where owner_id is null;

create index if not exists dictionary_entries_owner_idx on public.dictionary_entries (owner_id);
