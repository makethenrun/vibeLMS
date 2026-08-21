-- ===========================================================================
-- 0027_assistants
-- Assistant teachers: a restricted staff role. They can see only the groups and
-- materials the main tutor assigns them, run live sessions, and edit a material
-- only when granted (assistant_materials.can_edit).
-- ===========================================================================

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('TUTOR', 'STUDENT', 'ASSISTANT'));

create table if not exists public.assistant_groups (
  assistant_id uuid not null references public.users (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  primary key (assistant_id, group_id)
);

create table if not exists public.assistant_materials (
  assistant_id uuid not null references public.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  can_edit boolean not null default false,
  primary key (assistant_id, material_id)
);

alter table public.assistant_groups enable row level security;
alter table public.assistant_materials enable row level security;
