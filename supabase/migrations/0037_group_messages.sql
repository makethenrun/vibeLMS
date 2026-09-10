-- ===========================================================================
-- 0037_group_messages
-- Group chats: one shared thread per group. Participants are the group's
-- students, assistants with access to the group, and the tutor.
-- ===========================================================================

create table if not exists public.group_messages (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.groups (id) on delete cascade,
  sender_id       uuid not null references public.users (id) on delete cascade,
  body            text,
  attachment_url  text,
  attachment_name text,
  created_at      timestamptz not null default now()
);

create index if not exists group_messages_group_id_idx on public.group_messages (group_id, created_at);

alter table public.group_messages enable row level security;
