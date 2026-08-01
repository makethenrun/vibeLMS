-- ===========================================================================
-- 0008_restore_modules
-- Reintroduce the "module" level between lesson and items.
-- Hierarchy: material → section → lesson → module → items.
-- Safe on the current state (constructor data is empty): items are recreated.
-- Run AFTER 0007.
-- ===========================================================================

drop table if exists public.material_items cascade;

create table if not exists public.material_modules (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.material_lessons (id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists material_modules_lesson_id_idx on public.material_modules (lesson_id);

create table if not exists public.material_items (
  id         uuid primary key default gen_random_uuid(),
  module_id  uuid not null references public.material_modules (id) on delete cascade,
  position   integer not null default 0,
  type       text not null check (type in ('INFO','CHOICE','GAPS','FREE','MATCH')),
  content    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists material_items_module_id_idx on public.material_items (module_id);

alter table public.material_modules enable row level security;
alter table public.material_items   enable row level security;
