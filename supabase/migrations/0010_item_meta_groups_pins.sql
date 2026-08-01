-- ===========================================================================
-- 0010_item_meta_groups_pins
-- 1. Item envelope fields: optional title + note (with hide-from-student flag).
-- 2. Material ↔ groups access (which groups can see a material).
-- 3. Item ↔ group pins (highlight/priority an exercise for a group).
-- ===========================================================================

alter table public.material_items add column if not exists title text;
alter table public.material_items add column if not exists note text;
alter table public.material_items add column if not exists note_hidden boolean not null default false;

-- Groups that have access to a material.
create table if not exists public.material_groups (
  material_id uuid not null references public.materials (id) on delete cascade,
  group_id    uuid not null references public.groups (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (material_id, group_id)
);
create index if not exists material_groups_group_id_idx on public.material_groups (group_id);

-- Exercises pinned / highlighted for a specific group.
create table if not exists public.material_item_pins (
  item_id    uuid not null references public.material_items (id) on delete cascade,
  group_id   uuid not null references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, group_id)
);
create index if not exists material_item_pins_group_id_idx on public.material_item_pins (group_id);

alter table public.material_groups     enable row level security;
alter table public.material_item_pins  enable row level security;
