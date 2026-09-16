-- ===========================================================================
-- 0045_grammar_reference
-- A shared grammar reference: an ordered set of text blocks (title + body) that
-- everyone can browse as a carousel with search. Managed by tutors/administrators.
-- ===========================================================================

create table if not exists public.grammar_entries (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grammar_entries_position_idx on public.grammar_entries (position, created_at);

alter table public.grammar_entries enable row level security;
