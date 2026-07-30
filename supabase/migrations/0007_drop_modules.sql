-- ===========================================================================
-- 0007_drop_modules
-- Remove the "module" level. Items now attach directly to a lesson.
-- Hierarchy becomes: material → section → lesson → items.
-- Safe on a fresh DB (no meaningful data yet): items are recreated.
-- ===========================================================================

drop table if exists public.material_items cascade;
drop table if exists public.material_modules cascade;

create table if not exists public.material_items (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.material_lessons (id) on delete cascade,
  position   integer not null default 0,
  type       text not null check (type in ('INFO','CHOICE','GAPS','FREE','MATCH')),
  content    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists material_items_lesson_id_idx on public.material_items (lesson_id);

alter table public.material_items enable row level security;
