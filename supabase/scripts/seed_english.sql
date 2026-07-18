-- ===========================================================================
-- seed_english.sql — demo data for an English-language tutoring practice
-- ---------------------------------------------------------------------------
-- Creates:
--   * 3 groups (A1 / B1 / C1)
--   * 6 student PROFILES only — no login accounts, NOT assigned to any group
--     (you grant access and distribute them to groups yourself)
--   * 12 lessons spread across two weeks: 15–26 June 2026 (all AFTER 12 Jun)
--   * 6 QUIZ homeworks (English grammar/vocab). No submissions yet, so every
--     test is "unchecked" — it starts being graded automatically once a
--     student takes it.
--
-- Times are written in Moscow time (+03:00); adjust the offset if you prefer.
-- Run AFTER reset_data.sql, in the Supabase SQL editor. Re-running creates
-- duplicates, so reset first if you want a clean slate.
-- ===========================================================================

-- --- Temporary helpers (auto-dropped at session end) -----------------------
create or replace function pg_temp.seed_quiz(
  p_lesson       uuid,
  p_title        text,
  p_deadline     timestamptz default null,
  p_max_attempts int default null
) returns uuid language plpgsql as $func$
declare
  v_hw uuid;
  v_qz uuid;
begin
  insert into public.homework (lesson_id, title, type, deadline, max_attempts)
  values (p_lesson, p_title, 'QUIZ', p_deadline, p_max_attempts)
  returning id into v_hw;

  insert into public.quizzes (homework_id) values (v_hw) returning id into v_qz;
  return v_qz;
end;
$func$;

create or replace function pg_temp.seed_q(
  p_quiz     uuid,
  p_pos      int,
  p_question text,
  p_options  text[],          -- NULL => free-text answer
  p_correct  text[],          -- correct option(s) / the free-text answer
  p_grading  text default 'STRICT'
) returns void language plpgsql as $func$
begin
  insert into public.quiz_questions
    (quiz_id, position, question, options, correct_answers, correct_answer, grading)
  values (
    p_quiz,
    p_pos,
    p_question,
    p_options,
    case when p_options is null then null else p_correct end,
    coalesce(p_correct[1], ''),
    p_grading
  );
end;
$func$;

-- --- Seed -------------------------------------------------------------------
do $seed$
declare
  g1 uuid; g2 uuid; g3 uuid;        -- groups
  b1 uuid; b3 uuid;                 -- beginner   lessons 1 & 3 (get a quiz)
  i1 uuid; i3 uuid;                 -- intermediate lessons 1 & 3
  a1 uuid; a3 uuid;                 -- advanced   lessons 1 & 3
  qz uuid;                          -- reusable quiz id
begin
  -- ===== Groups =====
  insert into public.groups (name) values ('English · Beginner (A1)')     returning id into g1;
  insert into public.groups (name) values ('English · Intermediate (B1)') returning id into g2;
  insert into public.groups (name) values ('English · Advanced (C1)')     returning id into g3;

  -- ===== Students (profiles only: no login, no group) =====
  insert into public.students (full_name, notes) values
    ('Анна Иванова',      'English · A1'),
    ('Борис Петров',      'English · A1'),
    ('Виктория Сидорова', 'English · B1'),
    ('Григорий Кузнецов', 'English · B1'),
    ('Дарья Морозова',    'English · C1'),
    ('Егор Волков',       'English · C1');

  -- ===== Lessons (15–26 Jun 2026) =====
  -- Beginner — Mon/Wed 17:00
  insert into public.lessons (title, group_id, start_time, end_time, meeting_url)
    values ('Lesson 1 · Present Simple',   g1, '2026-06-15 17:00+03', '2026-06-15 18:00+03', 'https://meet.example.com/a1-1')
    returning id into b1;
  insert into public.lessons (title, group_id, start_time, end_time)
    values ('Lesson 2 · To be & pronouns', g1, '2026-06-17 17:00+03', '2026-06-17 18:00+03');
  insert into public.lessons (title, group_id, start_time, end_time, meeting_url)
    values ('Lesson 3 · Daily routines',   g1, '2026-06-22 17:00+03', '2026-06-22 18:00+03', 'https://meet.example.com/a1-3')
    returning id into b3;
  insert into public.lessons (title, group_id, start_time, end_time)
    values ('Lesson 4 · There is / there are', g1, '2026-06-24 17:00+03', '2026-06-24 18:00+03');

  -- Intermediate — Tue/Thu 18:30
  insert into public.lessons (title, group_id, start_time, end_time, meeting_url)
    values ('Lesson 1 · Past Simple vs Continuous', g2, '2026-06-16 18:30+03', '2026-06-16 19:45+03', 'https://meet.example.com/b1-1')
    returning id into i1;
  insert into public.lessons (title, group_id, start_time, end_time)
    values ('Lesson 2 · Present Perfect', g2, '2026-06-18 18:30+03', '2026-06-18 19:45+03');
  insert into public.lessons (title, group_id, start_time, end_time, meeting_url)
    values ('Lesson 3 · Phrasal verbs',   g2, '2026-06-23 18:30+03', '2026-06-23 19:45+03', 'https://meet.example.com/b1-3')
    returning id into i3;
  insert into public.lessons (title, group_id, start_time, end_time)
    values ('Lesson 4 · Future forms',    g2, '2026-06-25 18:30+03', '2026-06-25 19:45+03');

  -- Advanced — Wed/Fri 19:00
  insert into public.lessons (title, group_id, start_time, end_time, meeting_url)
    values ('Lesson 1 · Conditionals',    g3, '2026-06-17 19:00+03', '2026-06-17 20:30+03', 'https://meet.example.com/c1-1')
    returning id into a1;
  insert into public.lessons (title, group_id, start_time, end_time)
    values ('Lesson 2 · Inversion',       g3, '2026-06-19 19:00+03', '2026-06-19 20:30+03');
  insert into public.lessons (title, group_id, start_time, end_time, meeting_url)
    values ('Lesson 3 · Idioms & collocations', g3, '2026-06-24 19:00+03', '2026-06-24 20:30+03', 'https://meet.example.com/c1-3')
    returning id into a3;
  insert into public.lessons (title, group_id, start_time, end_time)
    values ('Lesson 4 · Reported speech', g3, '2026-06-26 19:00+03', '2026-06-26 20:30+03');

  -- ===== Quiz homework (unchecked: no submissions) =====

  -- A1 / Present Simple — deadline 21 Jun, up to 2 attempts
  qz := pg_temp.seed_quiz(b1, 'ДЗ: Present Simple', '2026-06-21 23:59+03', 2);
  perform pg_temp.seed_q(qz, 0, 'She ___ to school every day.',
    array['go','goes','going'], array['goes']);
  perform pg_temp.seed_q(qz, 1, 'Negative: "They ___ like coffee."',
    array['don''t','doesn''t','isn''t'], array['don''t']);
  perform pg_temp.seed_q(qz, 2, 'Which are typical Present Simple time markers? (выберите все)',
    array['every day','usually','now','at the moment'], array['every day','usually'], 'PARTIAL');
  perform pg_temp.seed_q(qz, 3, 'Переведите: «Я не понимаю».',
    null::text[], array['I don''t understand']);

  -- A1 / Daily routines — no deadline, unlimited attempts
  qz := pg_temp.seed_quiz(b3, 'ДЗ: Daily routines & vocabulary');
  perform pg_temp.seed_q(qz, 0, 'I ___ up at 7 a.m.',
    array['get','gets','getting'], array['get']);
  perform pg_temp.seed_q(qz, 1, 'Antonym of "early"?',
    array['late','soon','fast'], array['late']);
  perform pg_temp.seed_q(qz, 2, 'Как по-английски «завтрак»?',
    null::text[], array['breakfast']);

  -- B1 / Past tenses — deadline 22 Jun, up to 3 attempts
  qz := pg_temp.seed_quiz(i1, 'ДЗ: Past Simple vs Past Continuous', '2026-06-22 23:59+03', 3);
  perform pg_temp.seed_q(qz, 0, 'While I ___ , the phone rang.',
    array['cooked','was cooking','cook'], array['was cooking']);
  perform pg_temp.seed_q(qz, 1, 'Past Simple of "go"?',
    array['goed','went','gone'], array['went']);
  perform pg_temp.seed_q(qz, 2, 'Which of these are irregular verbs? (выберите все)',
    array['play','buy','take','want'], array['buy','take'], 'PARTIAL');
  perform pg_temp.seed_q(qz, 3, 'Past Simple of "see" (one word).',
    null::text[], array['saw']);

  -- B1 / Phrasal verbs — no deadline, up to 2 attempts
  qz := pg_temp.seed_quiz(i3, 'ДЗ: Phrasal verbs', null, 2);
  perform pg_temp.seed_q(qz, 0, 'Please ___ your shoes before entering. (снять)',
    array['take off','take after','take up'], array['take off']);
  perform pg_temp.seed_q(qz, 1, '"give up" means…',
    array['продолжать','сдаться','раздавать'], array['сдаться']);
  perform pg_temp.seed_q(qz, 2, 'Which phrasal verbs mean "to continue"? (выберите все)',
    array['carry on','go on','put off','set off'], array['carry on','go on'], 'STRICT');

  -- C1 / Conditionals — deadline 23 Jun, unlimited attempts
  qz := pg_temp.seed_quiz(a1, 'ДЗ: Conditionals', '2026-06-23 23:59+03');
  perform pg_temp.seed_q(qz, 0, 'If I ___ rich, I would travel the world.',
    array['am','were','was'], array['were']);
  perform pg_temp.seed_q(qz, 1, 'The third conditional uses…',
    array['would + V','would have + V3','will + V'], array['would have + V3']);
  perform pg_temp.seed_q(qz, 2, 'Which sentences are real/likely conditions? (выберите все)',
    array['If it rains, we''ll stay.','If I were you, I would rest.','If you heat ice, it melts.','If I had known, I would have come.'],
    array['If it rains, we''ll stay.','If you heat ice, it melts.'], 'PARTIAL');
  perform pg_temp.seed_q(qz, 3, 'Fill the gap: "I wish I ___ (be) taller." (one word)',
    null::text[], array['were']);

  -- C1 / Idioms — no deadline, up to 2 attempts
  qz := pg_temp.seed_quiz(a3, 'ДЗ: Idioms & collocations', null, 2);
  perform pg_temp.seed_q(qz, 0, '"Once in a blue moon" means…',
    array['very often','very rarely','never'], array['very rarely']);
  perform pg_temp.seed_q(qz, 1, 'Correct collocations with "make"? (выберите все)',
    array['make a decision','make a mistake','do a mistake','make homework'],
    array['make a decision','make a mistake'], 'STRICT');
  perform pg_temp.seed_q(qz, 2, 'Idiom: "to let the cat out of the ___".',
    null::text[], array['bag']);
end;
$seed$;
