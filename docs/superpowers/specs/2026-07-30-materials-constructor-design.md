# Конструктор материалов — дизайн (v1: авторинг)

**Дата:** 2026-07-30
**Статус:** утверждён к реализации
**Аналог:** Progressme

> **Пересмотр 2026-07-31 (см. раздел «Ревизия» в конце):** уровень «Модуль»
> удалён — иерархия стала 4-уровневой (Материал → Раздел → Урок →
> упражнения/инфо). Экран урока переделан в два-панельный: слева содержимое
> урока, справа интерактивное дерево разделы→уроки. Отдельные страницы
> разделов и модулей убраны. Разделы ниже описывают исходную 5-уровневую
> версию; актуальна ревизия.

## Контекст

Сейчас «Материал» — плоская запись: `title` + `file_url` + `material_type`,
общая библиотека (одна таблица `materials`). Материалы используются как выбор
файлового вложения при создании ДЗ (`app/(app)/homework/page.tsx` →
`listMaterials`).

Задача: превратить материал в полноценную редактируемую единицу — конструктор с
иерархией. Это большая система (модель данных, конструктор для репетитора, плеер
ученика, типы упражнений, прогресс/проверка), поэтому разбита на срезы.

**Этот спек покрывает только первый срез — авторинг:** модель данных и
конструктор для репетитора. Плеер ученика, исполнение авто-проверки и прогресс —
следующие срезы.

## Иерархия

Строгая вложенность из 5 уровней (в v1 все уровни обязательны):

```
Материал
└─ Раздел          (material_sections)
   └─ Урок         (material_lessons)
      └─ Модуль    (material_modules)
         └─ элементы: упражнение | обучающая информация   (material_items)
```

Модуль — контейнер с **упорядоченным списком элементов**; элементы (упражнения и
инфо-блоки) идут вперемешку.

## Типы элементов (v1)

Пять типов, все хранятся в `material_items` с полем `type` и `content jsonb`.
Модель расширяемая — новые типы добавляются без миграций схемы.

- `INFO` — обучающая информация (rich-text + медиа)
- `CHOICE` — выбор ответа (один/несколько правильных)
- `GAPS` — заполнить пропуски
- `FREE` — свободный ответ (ручная проверка)
- `MATCH` — сопоставление пар

## Решения (утверждены)

- **Первый срез — только авторинг.** Плеер ученика следующим срезом.
- **Материал = контейнер-конструктор.** Плоские файлы-вложения для ДЗ живут
  отдельно (см. «Файлы vs материалы»).
- **Модель данных — нормализованная** (таблица на уровень), JSONB только на
  листе (`material_items.content`).
- **Форма конструктора — drill-down по роутам** (экран/роут на уровень).
- **Ре-ордер v1 — кнопки ↑/↓** (без DnD-зависимости).
- **Обучающая информация — rich-text + медиа** (Tiptap).

---

## 1. Модель данных

Новые/изменённые таблицы. Каждая таблица уровня имеет `position integer not null
default 0` для порядка (как `quiz_questions.position`), `created_at timestamptz`,
и каскадное удаление вниз по иерархии. RLS enable / no policies — как у всех
таблиц (service-role — единственный путь).

### `materials` (контейнер, редефайн существующей)

| Поле | Тип | Прим. |
|---|---|---|
| `id` | uuid pk | `gen_random_uuid()` |
| `title` | text not null | |
| `description` | text | nullable |
| `cover_url` | text | nullable |
| `created_at` | timestamptz not null default now() | |
| `updated_at` | timestamptz not null default now() | обновляется при правках |

Старые колонки `file_url`, `material_type` уезжают в таблицу `files` (см. §2).

### `material_sections`

`id` uuid pk · `material_id` uuid not null → `materials(id)` on delete cascade ·
`title` text not null · `position` int · `created_at`.
Индекс по `material_id`.

### `material_lessons`

`id` uuid pk · `section_id` uuid not null → `material_sections(id)` on delete
cascade · `title` text not null · `position` int · `created_at`.
Индекс по `section_id`.

### `material_modules`

`id` uuid pk · `lesson_id` uuid not null → `material_lessons(id)` on delete
cascade · `title` text not null · `position` int · `created_at`.
Индекс по `lesson_id`.

### `material_items` (лист)

`id` uuid pk · `module_id` uuid not null → `material_modules(id)` on delete
cascade · `position` int · `type` text not null check (`type in
('INFO','CHOICE','GAPS','FREE','MATCH')`) · `content` jsonb not null default
'{}' · `created_at` · `updated_at`.
Индекс по `module_id`.

### Форматы `content` по типам

Валидируются zod discriminated union по `type` (см. §4). Ключи ответов
сохраняются уже сейчас — их использует плеер в следующем срезе.

- **INFO**
  ```json
  { "doc": { /* Tiptap JSON: параграфы, списки, заголовки, ссылки,
               узлы image/audio/video/file со ссылками на storage */ } }
  ```
- **CHOICE** (зеркалит логику `quiz_questions`)
  ```json
  {
    "question": "string",
    "options": ["string", ...],
    "correct": [0, 2],
    "multiple": true,
    "grading": "STRICT" | "PARTIAL"
  }
  ```
- **GAPS**
  ```json
  {
    "text": "Past form of go is {{1}} and see is {{2}}.",
    "blanks": [
      { "index": 1, "answers": ["went"], "options": null },
      { "index": 2, "answers": ["saw"],  "options": ["saw","seen","see"] }
    ]
  }
  ```
  `options` != null → выбор из словесного банка; null → свободный ввод.
  `answers` — все принимаемые варианты (без учёта регистра при проверке).
- **FREE**
  ```json
  { "prompt": "string", "sampleAnswer": "string | null" }
  ```
- **MATCH**
  ```json
  { "prompt": "string | null", "pairs": [ { "left": "string", "right": "string" }, ... ] }
  ```

---

## 2. Файлы vs материалы (без регресса ДЗ)

Текущая плоская таблица `materials` переименовывается в **`files`**
(`id`, `title`, `file_url`, `material_type`, `created_at` — как сейчас). Её
нынешний UI (`app/(app)/materials/*`: список карточек, диалог загрузки)
переезжает на роут **`/files`** («Файлы») с сохранением текущего поведения.

Это сохраняет выбор файлового вложения из библиотеки при создании ДЗ:
`homework/page.tsx` меняет `listMaterials` → `listFiles`, остальная логика ДЗ не
меняется (поля `file_url` / `material_type` сохраняются в `files`).

Роут **`/materials`** и пункт навигации «Материалы» теперь ведут в конструктор.
В навигацию добавляется пункт «Файлы» → `/files`.

Миграция данных тривиальна — база свежая (данных нет).

---

## 3. Роутинг (drill-down)

Плоские параметры по глобально-уникальным id; хлебные крошки строятся
parent-lookup'ом вверх по иерархии.

```
/materials                      — список материалов (карточки) + «Создать»
/materials/[materialId]         — обзор материала: правка title/описания/обложки;
                                  список разделов (CRUD + ре-ордер ↑/↓)
/materials/sections/[sectionId] — уроки раздела (CRUD + ре-ордер)
/materials/lessons/[lessonId]   — модули урока (CRUD + ре-ордер)
/materials/modules/[moduleId]   — редактор элементов модуля (ядро конструктора)
```

Только `TUTOR` имеет доступ к конструктору (guard как в остальных tutor-роутах).

### Редактор модуля (`/materials/modules/[moduleId]`)

Упорядоченный список элементов модуля. «+ Элемент» → выбор типа (INFO / CHOICE /
GAPS / FREE / MATCH) → инлайн-редактор соответствующего типа. У каждого элемента:
правка, удаление, ре-ордер ↑/↓.

Инлайн-редакторы по типам:
- **INFO** — Tiptap rich-text редактор с вставкой медиа.
- **CHOICE** — вопрос + список вариантов (добавить/удалить) + отметка
  правильных + переключатель «несколько правильных» + режим оценки STRICT/PARTIAL
  (переиспользует UX билдера квизов из `homework`).
- **GAPS** — поле текста с маркерами `{{n}}` + редактор списка пропусков
  (принимаемые ответы; опционально словесный банк).
- **FREE** — промпт + необязательный образец ответа.
- **MATCH** — необязательный промпт + список пар left/right.

---

## 4. Слои кода (по существующим паттернам)

### Сервисы (`server-only`, service-role)

- `services/materials/materials.service.ts` — CRUD контейнера + `updated_at`.
- `services/materials/sections.service.ts`
- `services/materials/lessons.service.ts`
- `services/materials/modules.service.ts`
- `services/materials/items.service.ts`
- `services/files/files.service.ts` — переименование текущего
  `materials.service.ts` (list/get/create/delete файлов).

Каждый сервис: list (по родителю, order by position), get, create (position =
max+1), update, delete, reorder (перестановка соседних позиций для ↑/↓).
Функции композитных запросов для хлебных крошек (lookup родителей по id).

### Валидация (`lib/validators/materials/`)

- zod-схемы сущностей (section/lesson/module — `title`).
- `itemContentSchema` — discriminated union по `type` для `content` каждого типа.
- Экспорт выведенных TS-типов (`no any`, strict).

### Server Actions (`app/(app)/materials/actions.ts`)

Мутации всех сущностей (create/update/delete/reorder + item-мутации), по образцу
`app/(app)/homework/actions.ts` и `app/(app)/materials/actions.ts` (текущего).
Ошибки полей — через `applyFieldErrors` (существующий util).

### Rich-text (Tiptap)

Зависимости: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`
(+ кастомные узлы `audio`/`video`/`file`). Компонент
`components/editor/rich-text-editor.tsx` (клиентский). Загрузка медиа — через
существующий `POST /api/storage/upload`; в Tiptap JSON хранятся storage-URL.

### Типы (`types/index.ts`)

Добавить row-типы новых таблиц из сгенерированных `database.types` и композитные
view-модели (материал с разделами, модуль с элементами, крошки).

---

## 5. Ре-ордер

v1 — кнопки ↑/↓ у каждого элемента списка на каждом уровне. Server action меняет
местами `position` соседних записей в пределах одного родителя. Без новой
DnD-зависимости — проще строить и тестировать. Drag-and-drop (`@dnd-kit`) —
полировка на будущий срез.

---

## 6. Вне объёма v1 (следующие срезы)

- Плеер ученика (прохождение материала: чтение + интерактив упражнений).
- Исполнение авто-проверки и подсчёт баллов.
- Прогресс ученика по материалу.
- Назначение материалов группам / ученикам / урокам.
- Drag-and-drop ре-ордер.
- Публикация / версии / статусы (draft/published).
- Типы упражнений сверх четырёх.
- Общий банк упражнений (переиспользование между материалами).

---

## 7. Тестирование

**В проекте сейчас нет тест-раннера** (в `package.json` только `type-check`
= `tsc --noEmit` и `lint`). Первой задачей плана поднимаем **Vitest** и дальше
идём по TDD на чистой логике.

Покрыть автотестами (Vitest):
- zod-схемы `content` каждого типа (валидные/невалидные кейсы, discriminated
  union по `type`).
- Чистую логику ре-ордера позиций (перестановка соседей, границы списка) —
  вынесена в чистую функцию, тестируется без БД.

UI, server actions и запросы к БД (интеграция с Supabase) проверяются через
`tsc --noEmit`, `next lint` и ручную проверку — юнит-тесты БД-слоя без реального
Supabase в объём v1 не входят.

---

## Затронутые существующие файлы

- `supabase/schema.sql` — финальное состояние схемы (files + новые таблицы).
- `supabase/migrations/0006_materials_constructor.sql` — новая миграция.
- `app/(app)/materials/*` — текущий файловый UI переезжает в `app/(app)/files/*`.
- `app/(app)/homework/page.tsx` — `listMaterials` → `listFiles`.
- `services/materials/materials.service.ts` — переезд в `services/files/`.
- `lib/validators/material.ts` — переезд/переименование в files-валидатор + новые
  валидаторы конструктора.
- Навигация — добавить пункт «Файлы», «Материалы» → конструктор.
- `types/index.ts` — новые row-типы и view-модели.

---

## Ревизия 2026-07-31 — экран урока и удаление модулей

Утверждена смена UX и модели после первой реализации (БД ещё пустая).

### Иерархия (стала 4-уровневой)

```
Материал → Раздел → Урок → элементы (упражнение | обучающая информация)
```

Уровень **Модуль удалён**. Элементы привязаны напрямую к уроку.

### Модель данных

- Таблица `material_modules` — **удаляется**.
- `material_items.module_id` → **`material_items.lesson_id`** (ref
  `material_lessons(id)` on delete cascade). `position` — в пределах урока.
- Миграция `0007_drop_modules.sql` (для уже созданной БД) + правка `schema.sql`
  и `database.types.ts`.

### Экран урока `/materials/lessons/[lessonId]` (главный рабочий стол)

Двух-панельная раскладка:
- **Слева** — содержимое урока: упражнения/инфо видны сразу, инлайн-редакторы
  (перенесены с бывшей страницы модуля), ↑/↓/удалить, «Добавить элемент».
- **Справа** — интерактивное дерево навигации по материалу: разделы с
  вложенными уроками; активный урок подсвечен; клик по уроку открывает его
  слева. В дереве же — CRUD структуры (добавить раздел/урок, переименовать,
  ↑/↓, удалить).

### Страницы/роуты

- **Удаляются:** `/materials/modules/[moduleId]` (весь модульный UI),
  `/materials/sections/[sectionId]` (список уроков — его роль берёт дерево).
- **`/materials/[materialId]`** — та же двух-панельная раскладка: справа дерево,
  слева пустое состояние «Выберите или создайте урок».
- **`/materials/lessons/[lessonId]`** — основной экран (выше).
- `/materials` (список материалов) и `/files` — без изменений.

### Затронутый код

- БД: `schema.sql`, `migrations/0007_drop_modules.sql`, `database.types.ts`,
  `types/index.ts` (убрать `ModuleRow`).
- Сервисы: удалить `modules.service.ts`; `items.service.ts` и
  `breadcrumbs.service.ts` — по `lessonId`; добавить `material-tree.service.ts`
  (`getMaterialTree` — разделы с уроками).
- Actions: убрать module-actions; item-actions — по `lessonId`.
- UI: новый `MaterialTree` (правая панель) + двух-панельный layout; перенос
  `item-list` и `item-editors` в контекст урока; удаление модульных и
  section-страниц.
- Тесты ре-ордера и контента остаются валидны без изменений.
