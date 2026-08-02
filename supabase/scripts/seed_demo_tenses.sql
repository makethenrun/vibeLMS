-- ===========================================================================
-- Демо: материал «Времена в английском языке» + 3 группы по 2 ученика.
-- Все форматы упражнений, кроме AUDIO и VIDEO. Картинки — эмодзи (SVG data-URI).
-- Логины учеников равны паролям: a1 a2 b1 b2 c1 c2.
-- Запускать в Supabase SQL Editor ЦЕЛИКОМ. Идемпотентно (пере-создаёт демо).
-- Требует применённых миграций 0006–0013 (0014 — для прохождения учениками).
-- ===========================================================================

-- pgcrypto (crypt/gen_salt) в Supabase обычно в схеме extensions — добавим в путь.
set search_path to public, extensions;

-- --- Очистка прошлого прогона -------------------------------------------------
delete from materials where title = 'Времена в английском языке';
delete from groups where name in ('Группа A', 'Группа B', 'Группа C');
delete from students where full_name in ('Ученик A1','Ученик A2','Ученик B1','Ученик B2','Ученик C1','Ученик C2');
delete from users where login in ('a1','a2','b1','b2','c1','c2');

-- --- Хелперы (временные, живут в рамках сессии) ------------------------------
create or replace function pg_temp.emoji_img(e text) returns text language sql immutable as $f$
  select 'data:image/svg+xml;utf8,<svg xmlns=' || chr(39) || 'http://www.w3.org/2000/svg' || chr(39) ||
    ' width=' || chr(39) || '100' || chr(39) || ' height=' || chr(39) || '100' || chr(39) || '>' ||
    '<text x=' || chr(39) || '50' || chr(39) || ' y=' || chr(39) || '72' || chr(39) ||
    ' font-size=' || chr(39) || '60' || chr(39) || ' text-anchor=' || chr(39) || 'middle' || chr(39) || '>' ||
    e || '</text></svg>'
$f$;

create or replace function pg_temp.mk_student(p_login text, p_name text, p_group uuid) returns void language plpgsql as $f$
declare uid uuid; sid uuid;
begin
  insert into users (login, password_hash, role)
    values (p_login, crypt(p_login, gen_salt('bf')), 'STUDENT') returning id into uid;
  insert into students (user_id, full_name) values (uid, p_name) returning id into sid;
  insert into group_members (group_id, student_id) values (p_group, sid);
end $f$;

-- --- Наполнение ---------------------------------------------------------------
do $$
declare
  mat_id uuid; sec_id uuid; les_id uuid; mod_id uuid;
  ga uuid; gb uuid; gc uuid;
begin
  -- Группы
  insert into groups (name) values ('Группа A') returning id into ga;
  insert into groups (name) values ('Группа B') returning id into gb;
  insert into groups (name) values ('Группа C') returning id into gc;

  -- Ученики (логин = пароль)
  perform pg_temp.mk_student('a1', 'Ученик A1', ga);
  perform pg_temp.mk_student('a2', 'Ученик A2', ga);
  perform pg_temp.mk_student('b1', 'Ученик B1', gb);
  perform pg_temp.mk_student('b2', 'Ученик B2', gb);
  perform pg_temp.mk_student('c1', 'Ученик C1', gc);
  perform pg_temp.mk_student('c2', 'Ученик C2', gc);

  -- Материал + доступ всем трём группам
  insert into materials (title, description, cover_url)
    values ('Времена в английском языке',
            'Демонстрационный материал: все форматы упражнений (кроме аудио и видео).',
            pg_temp.emoji_img('🕰️'))
    returning id into mat_id;
  insert into material_groups (material_id, group_id) values (mat_id, ga), (mat_id, gb), (mat_id, gc);

  -- ===================== Раздел 1: Настоящее и прошедшее =====================
  insert into material_sections (material_id, title, position) values (mat_id, 'Настоящее и прошедшее', 0) returning id into sec_id;

  -- Урок 1: Введение (теория и медиа)
  insert into material_lessons (section_id, title, position) values (sec_id, 'Введение', 0) returning id into les_id;
  insert into material_modules (lesson_id, title, position) values (les_id, 'Теория', 0) returning id into mod_id;

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 0, 'INFO', 'Кратко о временах',
     '{"type":"INFO","doc":{"type":"doc","content":[
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Времена в английском"}]},
        {"type":"paragraph","content":[{"type":"text","text":"Present Simple — регулярные действия и факты. Past Simple — завершённые действия в прошлом. Future — будущее."}]},
        {"type":"bulletList","content":[
          {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"I work every day. (Present Simple)"}]}]},
          {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"I worked yesterday. (Past Simple)"}]}]}
        ]}]}}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 1, 'IMAGE', 'Который час?',
     jsonb_build_object('type','IMAGE','url', pg_temp.emoji_img('⏰'), 'caption','Время и времена'));

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 2, 'CAROUSEL', 'Три времени',
     jsonb_build_object('type','CAROUSEL','images', jsonb_build_array(
       jsonb_build_object('url', pg_temp.emoji_img('⏰'), 'caption','Present'),
       jsonb_build_object('url', pg_temp.emoji_img('⏳'), 'caption','Past'),
       jsonb_build_object('url', pg_temp.emoji_img('⏭️'), 'caption','Future'))));

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 3, 'LINK', 'Справочник по временам',
     '{"type":"LINK","url":"https://www.ego4u.com/en/cram-up/grammar/tenses","label":"Открыть справочник"}'::jsonb);

  -- Урок 2: Практика (тест, пропуски, свободный ответ)
  insert into material_lessons (section_id, title, position) values (sec_id, 'Практика', 1) returning id into les_id;
  insert into material_modules (lesson_id, title, position) values (les_id, 'Упражнения', 0) returning id into mod_id;

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 0, 'QUIZ', 'Тест (с таймером)',
     '{"type":"QUIZ","timerSeconds":120,"questions":[
        {"question":"He ___ football on Sundays.","options":["play","plays","played"],"correctAnswers":["plays"],"correctAnswer":"","grading":"STRICT"},
        {"question":"Past Simple of go?","options":[],"correctAnswers":[],"correctAnswer":"went","grading":"STRICT"},
        {"question":"Отметьте формы прошедшего времени:","options":["ran","run","ate","eat"],"correctAnswers":["ran","ate"],"correctAnswer":"","grading":"PARTIAL"}
      ]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 1, 'GAPS', 'Пропуски: ввод',
     '{"type":"GAPS","mode":"INPUT","text":"Yesterday I {{1}} to school and {{2}} English.","blanks":[
        {"index":1,"answers":["went"],"options":null},
        {"index":2,"answers":["studied","learned"],"options":null}],"bank":[]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 2, 'GAPS', 'Пропуски: выбор из списка',
     '{"type":"GAPS","mode":"SELECT","text":"She {{1}} tea every morning.","blanks":[
        {"index":1,"answers":["drinks"],"options":["drinks","drink","drank"]}],"bank":[]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 3, 'GAPS', 'Пропуски: перетаскивание',
     '{"type":"GAPS","mode":"DRAG","text":"They {{1}} to Rome and {{2}} the Colosseum.","blanks":[
        {"index":1,"answers":["went"],"options":null},
        {"index":2,"answers":["visited"],"options":null}],"bank":["went","visited","go","visit"]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 4, 'FREE', 'Свободный ответ',
     '{"type":"FREE","prompt":"Опишите вчерашний день в Past Simple (3-4 предложения).","sampleAnswer":null}'::jsonb);

  -- ===================== Раздел 2: Работа с предложениями =====================
  insert into material_sections (material_id, title, position) values (mat_id, 'Работа с предложениями', 1) returning id into sec_id;
  insert into material_lessons (section_id, title, position) values (sec_id, 'Предложения', 0) returning id into les_id;
  insert into material_modules (lesson_id, title, position) values (les_id, 'Упражнения', 0) returning id into mod_id;

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 0, 'SENTENCE_TASK', 'Порядок слов',
     '{"type":"SENTENCE_TASK","variant":"WORD_ORDER","prompt":"Соберите предложение","words":["I","have","never","been","to","London"],"sentences":[],"word":"","extraLetters":"","columns":[],"pairs":[]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 1, 'SENTENCE_TASK', 'Порядок предложений',
     '{"type":"SENTENCE_TASK","variant":"SENTENCE_ORDER","prompt":"Расставьте по порядку","words":[],"sentences":["I woke up.","I had breakfast.","I went to work.","I came home."],"word":"","extraLetters":"","columns":[],"pairs":[]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 2, 'SENTENCE_TASK', 'Слово из букв',
     '{"type":"SENTENCE_TASK","variant":"WORD_FROM_LETTERS","prompt":"Составьте слово","words":[],"sentences":[],"word":"tomorrow","extraLetters":"xz","columns":[],"pairs":[]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 3, 'SENTENCE_TASK', 'Сортировка по колонкам',
     '{"type":"SENTENCE_TASK","variant":"SORT_COLUMNS","prompt":"Распределите по временам","words":[],"sentences":[],"word":"","extraLetters":"","columns":[
        {"title":"Present","items":["works","goes"]},
        {"title":"Past","items":["worked","went"]}],"pairs":[]}'::jsonb);

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 4, 'SENTENCE_TASK', 'Сопоставление слов',
     '{"type":"SENTENCE_TASK","variant":"MATCH_PAIRS","prompt":"Сопоставьте глаголы","words":[],"sentences":[],"word":"","extraLetters":"","columns":[],"pairs":[
        {"left":"go","right":"went"},{"left":"see","right":"saw"},{"left":"have","right":"had"}]}'::jsonb);

  -- ===================== Раздел 3: Слова и картинки =====================
  insert into material_sections (material_id, title, position) values (mat_id, 'Слова и картинки', 2) returning id into sec_id;
  insert into material_lessons (section_id, title, position) values (sec_id, 'Картинки', 0) returning id into les_id;
  insert into material_modules (lesson_id, title, position) values (les_id, 'Упражнения', 0) returning id into mod_id;

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 0, 'IMAGE_TASK', 'Ввести слово к картинке',
     jsonb_build_object('type','IMAGE_TASK','variant','TYPE_WORD','prompt','Напишите слово к картинке',
       'pairs', jsonb_build_array(
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🐶'), 'word','dog'),
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🐱'), 'word','cat')),
       'distractors', jsonb_build_array(), 'images', jsonb_build_array()));

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 1, 'IMAGE_TASK', 'Выбрать слово из списка',
     jsonb_build_object('type','IMAGE_TASK','variant','SELECT_WORD','prompt','Выберите слово к картинке',
       'pairs', jsonb_build_array(
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🍎'), 'word','apple'),
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🍌'), 'word','banana')),
       'distractors', jsonb_build_array('cherry','grape'), 'images', jsonb_build_array()));

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 2, 'IMAGE_TASK', 'Перенести слово к изображению',
     jsonb_build_object('type','IMAGE_TASK','variant','DRAG_WORD_TO_IMAGE','prompt','Перетащите слово на картинку',
       'pairs', jsonb_build_array(
         jsonb_build_object('imageUrl', pg_temp.emoji_img('☀️'), 'word','sun'),
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🌧️'), 'word','rain')),
       'distractors', jsonb_build_array(), 'images', jsonb_build_array()));

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 3, 'IMAGE_TASK', 'Перенести изображение к слову',
     jsonb_build_object('type','IMAGE_TASK','variant','DRAG_IMAGE_TO_WORD','prompt','Соотнесите картинку и слово',
       'pairs', jsonb_build_array(
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🚗'), 'word','car'),
         jsonb_build_object('imageUrl', pg_temp.emoji_img('✈️'), 'word','plane')),
       'distractors', jsonb_build_array(), 'images', jsonb_build_array()));

  insert into material_items (module_id, position, type, title, content) values
    (mod_id, 4, 'IMAGE_TASK', 'Выбрать верные изображения',
     jsonb_build_object('type','IMAGE_TASK','variant','SELECT_IMAGES','prompt','Выберите животных',
       'pairs', jsonb_build_array(), 'distractors', jsonb_build_array(),
       'images', jsonb_build_array(
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🐶'), 'correct', true),
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🍎'), 'correct', false),
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🐱'), 'correct', true),
         jsonb_build_object('imageUrl', pg_temp.emoji_img('🚗'), 'correct', false))));

  raise notice 'Демо создано: материал + 3 группы + 6 учеников (a1 a2 b1 b2 c1 c2).';
end $$;
