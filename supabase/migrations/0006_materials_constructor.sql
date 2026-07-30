-- ===========================================================================
-- 0006_materials_constructor
-- Split the flat file library off from the new constructor, and add the
-- constructor hierarchy: materials → sections → lessons → modules → items.
-- ===========================================================================

-- Split flat file library off from the new constructor.
alter table if exists public.materials rename to files;

-- New constructor container.
create table if not exists public.materials (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  cover_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.material_sections (
  id          uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists material_sections_material_id_idx on public.material_sections (material_id);

create table if not exists public.material_lessons (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.material_sections (id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists material_lessons_section_id_idx on public.material_lessons (section_id);

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

-- RLS: enable everywhere, no policies (service_role only).
alter table public.files             enable row level security;
alter table public.materials         enable row level security;
alter table public.material_sections enable row level security;
alter table public.material_lessons  enable row level security;
alter table public.material_modules  enable row level security;
alter table public.material_items    enable row level security;
