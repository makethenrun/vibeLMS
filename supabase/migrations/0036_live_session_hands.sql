-- ===========================================================================
-- 0036_live_session_hands
-- "Raise hand" during a live session: a student flags for the tutor's
-- attention; the row is removed when the hand is lowered or acknowledged.
-- ===========================================================================

create table if not exists public.live_session_hands (
  session_id uuid not null references public.live_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  raised_at  timestamptz not null default now(),
  primary key (session_id, student_id)
);

alter table public.live_session_hands enable row level security;
