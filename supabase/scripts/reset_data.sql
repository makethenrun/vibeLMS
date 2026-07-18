-- ===========================================================================
-- reset_data.sql — wipe ALL application data EXCEPT the tutor account
-- ---------------------------------------------------------------------------
-- ⚠️  DESTRUCTIVE AND IRREVERSIBLE. Deletes every student, group, lesson,
--     material, homework, quiz, submission, attempt, payment and attendance
--     row. Keeps:
--       * users with role = 'TUTOR'  (your login)
--       * the single `settings` row  (organization name / logo)
--
-- Run the whole file once in the Supabase SQL editor. Wrapped in a transaction
-- so it is all-or-nothing.
-- ===========================================================================

begin;

-- Children first, parents last — safe even without ON DELETE CASCADE.
delete from public.quiz_attempts;
delete from public.quiz_questions;
delete from public.quizzes;
delete from public.homework_submissions;
delete from public.homework;
delete from public.lesson_attendance;
delete from public.payments;
delete from public.group_members;
delete from public.lessons;
delete from public.groups;
delete from public.materials;

-- Students reference the (kept) tutor user via user_id ON DELETE SET NULL,
-- but tutors are never students, so this only removes student profiles.
delete from public.students;

-- Remove every login account that is NOT the tutor.
delete from public.users where role <> 'TUTOR';

commit;
