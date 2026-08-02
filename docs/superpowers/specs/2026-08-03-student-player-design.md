# Студенческий плеер — дизайн

**Дата:** 2026-08-03
**Статус:** в работе (фазами)

Сторона ученика для материалов-конструктора: ученик открывает доступные ему
материалы и проходит их, с проверкой и сохранением результатов.

## Решения (утверждены)
- **С сохранением результатов** (ответы + баллы в БД; ученик возвращается;
  результаты для репетитора — фаза P3).
- **Настоящий drag-and-drop** (@dnd-kit) для drag-форматов — фаза P2.

## Доступ
Ученик видит материалы, доступные его **группам**: `group_members` (student) →
`material_groups` → `materials`. Роуты ученика `/learn/*`, гардом `requireStudent`.

## Декомпозиция
- **P1 (этот срез):** доступ + навигация (материал→разделы→уроки→урок) +
  отображение read-форматов (INFO, AUDIO, VIDEO, IMAGE, CAROUSEL, LINK) + решение
  недраг-форматов с авто-проверкой и баллом: **QUIZ** (выбор/текст, таймер+blur),
  **GAPS** режимы INPUT/SELECT, **FREE** (сохранение, без авто-балла) +
  сохранение результатов (`material_item_submissions`).
- **P2:** @dnd-kit — GAPS DRAG, IMAGE_TASK (все вариации), SENTENCE_TASK,
  MATCH_PAIRS/MATCH. Проверка этих форматов.
- **P3:** экран результатов для репетитора + ручная проверка FREE.

## Модель данных (P1)
`material_item_submissions` — ответ и балл ученика на элемент:
`id, student_id→students, item_id→material_items, answer jsonb, score numeric(5,2)
null, submitted_at`, `unique(student_id, item_id)`. RLS enable / no policies.

Форматы ответов (`answer` jsonb) и проверка — чистые функции `checkItem` в
`lib/materials/scoring.ts` (юнит-тесты). Балл 0..100; `null` = ожидает проверки
(FREE).

## Роуты (P1)
- `/learn` — список доступных материалов.
- `/learn/materials/[materialId]` — разделы→уроки (read-навигация).
- `/learn/lessons/[lessonId]` — прохождение: модули с элементами, каждый
  недраг-элемент интерактивный, кнопка «Проверить» → балл, ответ сохраняется.

Нав: пункт «Обучение» для роли STUDENT → `/learn`. `route-access` разрешает
`/learn` ученику.

---

## P2 (done 2026-08-03) — drag-and-drop (@dnd-kit)

Все drag-форматы стали интерактивными для ученика, с авто-проверкой и
сохранением. Проверка — в `lib/materials/scoring.ts` (`scoreImageTask`,
`scoreSentenceTask`, MATCH), юнит-тесты.

- **GAPS DRAG** — банк слов → перетаскивание в поля (`AssignBoard`).
- **SENTENCE_TASK**: WORD_ORDER/SENTENCE_ORDER (`SortableChips`), WORD_FROM_LETTERS
  (буквы в позиции, `AssignBoard`), SORT_COLUMNS (`ColumnsBoard`, мульти-контейнер),
  MATCH_PAIRS (`AssignBoard`).
- **MATCH** (старый тип) — через `MatchPairsSolve`.
- **IMAGE_TASK**: TYPE_WORD (ввод), SELECT_WORD (выпадашка из слов+distractors),
  SELECT_IMAGES (клик по картинкам), DRAG_* (перетаскивание слов на картинки,
  `AssignBoard`).

DnD-примитивы: `_components/dnd/{sortable-chips,assign-board,columns-board}.tsx`;
решалки: `_components/solves/*`. @dnd-kit (core/sortable/utilities).

Остаётся **P3** — экран результатов для репетитора + ручная проверка FREE.
