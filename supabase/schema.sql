-- ===========================================================================
-- pLMS — PostgreSQL schema (Supabase)
-- ---------------------------------------------------------------------------
-- Single-tenant by design: one Supabase project == one tutor/customer.
-- There is intentionally NO tenant_id / organization_id / workspace_id.
--
-- Security model:
--   * pLMS uses its OWN auth layer (login + bcrypt password + signed JWT),
--     not Supabase Auth. All data access happens server-side with the
--     service-role key.
--   * Row Level Security is ENABLED on every table with NO policies. This
--     denies all access to the `anon` and `authenticated` roles, so even a
--     leaked anon key cannot read application data. The `service_role` key
--     bypasses RLS and is the only data path (server-only).
--
-- Run this whole file once in the Supabase SQL editor for a fresh project.
-- Safe to re-run (uses IF NOT EXISTS / idempotent guards).
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  login         text not null unique,
  password_hash text not null,
  role          text not null check (role in ('TUTOR', 'STUDENT')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- students
-- `user_id` links a student record to a login account (nullable: a tutor may
-- create a student profile before issuing credentials).
-- `is_archived` supports the archive feature without losing history.
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references public.users (id) on delete set null,
  full_name   text not null,
  notes       text,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists students_user_id_idx on public.students (user_id);
create index if not exists students_is_archived_idx on public.students (is_archived);

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- group_members (M:N students <-> groups)
-- ---------------------------------------------------------------------------
create table if not exists public.group_members (
  group_id   uuid not null references public.groups (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

create index if not exists group_members_student_id_idx on public.group_members (student_id);

-- ---------------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------------
create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  group_id    uuid not null references public.groups (id) on delete cascade,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  meeting_url text,
  status      text not null default 'SCHEDULED'
              check (status in ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  created_at  timestamptz not null default now()
);

create index if not exists lessons_group_id_idx on public.lessons (group_id);
create index if not exists lessons_start_time_idx on public.lessons (start_time);

-- ---------------------------------------------------------------------------
-- lesson_attendance (a row means the student was present at the lesson)
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_attendance (
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);

create index if not exists lesson_attendance_lesson_id_idx on public.lesson_attendance (lesson_id);
create index if not exists lesson_attendance_student_id_idx on public.lesson_attendance (student_id);

-- ---------------------------------------------------------------------------
-- materials (shared library)
-- ---------------------------------------------------------------------------
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  file_url      text not null,
  material_type text not null
                check (material_type in ('PDF', 'DOCX', 'JPG', 'PNG', 'WEBP', 'VIDEO_LINK')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- homework
-- ---------------------------------------------------------------------------
create table if not exists public.homework (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid not null references public.lessons (id) on delete cascade,
  title          text not null,
  type           text not null check (type in ('FILE', 'QUIZ')),
  deadline       timestamptz,
  -- For FILE homework: optional task file (uploaded or chosen from materials).
  attachment_url text,
  created_at     timestamptz not null default now()
);

create index if not exists homework_lesson_id_idx on public.homework (lesson_id);

-- ---------------------------------------------------------------------------
-- homework_submissions
-- For FILE homework `answer` stores the uploaded file URL.
-- For QUIZ homework `answer` stores a JSON array of the student's answers.
-- `score` is a 0..100 percentage (auto-computed for quizzes, manual for files).
-- ---------------------------------------------------------------------------
create table if not exists public.homework_submissions (
  id           uuid primary key default gen_random_uuid(),
  homework_id  uuid not null references public.homework (id) on delete cascade,
  student_id   uuid not null references public.students (id) on delete cascade,
  answer       text,
  score        numeric(5, 2),
  comment      text,
  submitted_at timestamptz not null default now(),
  unique (homework_id, student_id)
);

create index if not exists homework_submissions_homework_id_idx on public.homework_submissions (homework_id);
create index if not exists homework_submissions_student_id_idx on public.homework_submissions (student_id);

-- ---------------------------------------------------------------------------
-- quizzes (one per QUIZ homework)
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  homework_id uuid not null unique references public.homework (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- quiz_questions
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references public.quizzes (id) on delete cascade,
  question       text not null,
  correct_answer text not null,
  -- NULL/empty => free-text question; non-empty => multiple-choice options.
  options        text[],
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions (quiz_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  amount       numeric(12, 2) not null check (amount >= 0),
  payment_date date not null default current_date,
  comment      text,
  created_at   timestamptz not null default now()
);

create index if not exists payments_student_id_idx on public.payments (student_id);
create index if not exists payments_payment_date_idx on public.payments (payment_date);

-- ---------------------------------------------------------------------------
-- settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id                uuid primary key default gen_random_uuid(),
  organization_name text not null default 'pLMS',
  logo_url          text,
  created_at        timestamptz not null default now()
);

-- Seed exactly one settings row if none exists.
insert into public.settings (organization_name)
select 'pLMS'
where not exists (select 1 from public.settings);

-- ===========================================================================
-- Row Level Security: enable everywhere, define no policies.
-- This blocks anon/authenticated roles entirely; service_role bypasses RLS.
-- ===========================================================================
alter table public.users                enable row level security;
alter table public.students             enable row level security;
alter table public.groups               enable row level security;
alter table public.group_members        enable row level security;
alter table public.lessons              enable row level security;
alter table public.lesson_attendance    enable row level security;
alter table public.materials            enable row level security;
alter table public.homework             enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.quizzes              enable row level security;
alter table public.quiz_questions       enable row level security;
alter table public.payments             enable row level security;
alter table public.settings             enable row level security;
