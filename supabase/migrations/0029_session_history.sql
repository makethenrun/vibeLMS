-- ===========================================================================
-- 0029_session_history
-- Live-session history: who hosted a session and which students attended.
-- Sessions are pruned after 2 months (done opportunistically in app code when
-- the history is loaded; a pg_cron job may be added instead if preferred).
-- ===========================================================================

alter table public.live_sessions add column if not exists host_id uuid references public.users (id) on delete set null;

create table if not exists public.live_session_attendance (
  session_id uuid not null references public.live_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  first_seen timestamptz not null default now(),
  primary key (session_id, student_id)
);

create index if not exists live_sessions_ended_idx on public.live_sessions (ended_at);

alter table public.live_session_attendance enable row level security;
