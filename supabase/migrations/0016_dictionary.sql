-- ===========================================================================
-- 0016_dictionary
-- Shared dictionary of terms (word → translation, optional pinyin/note).
-- ===========================================================================

create table if not exists public.dictionary_entries (
  id          uuid primary key default gen_random_uuid(),
  term        text not null,
  translation text not null,
  pinyin      text,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists dictionary_entries_term_idx on public.dictionary_entries (term);

alter table public.dictionary_entries enable row level security;
