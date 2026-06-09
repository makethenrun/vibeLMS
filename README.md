# pLMS — Personal LMS

LMS-система для частных репетиторов и небольших образовательных центров: расписание занятий,
материалы, домашние задания, тесты с автопроверкой, статистика и учёт оплат.

> **Модель развёртывания:** это **не** SaaS. Каждый клиент получает собственный экземпляр —
> отдельный проект Supabase, отдельную базу PostgreSQL и отдельное файловое хранилище.
> Мультитенантности нет (никаких `tenant_id` / `organization_id` / `workspace_id`).

---

## Технологии

- **Next.js 15** (App Router, Server Components, Server Actions, Route Handlers)
- **React 19** + **TypeScript** (strict, без `any`)
- **Tailwind CSS** + **shadcn/ui** (Radix UI)
- **PostgreSQL** через **Supabase** (БД + Storage)
- Собственная авторизация: логин/пароль, **bcrypt** (`bcryptjs`) + сессии на подписанном JWT (`jose`) в httpOnly-cookie
- Валидация — **zod**, формы — **react-hook-form**

---

## Требования

- Node.js **18.18+** (рекомендуется 20+)
- npm (или pnpm/yarn)
- Аккаунт [Supabase](https://supabase.com)

---

## Быстрый старт

### 1. Создайте проект Supabase

1. Создайте новый проект на [supabase.com](https://supabase.com).
2. Откройте **SQL Editor** и выполните по очереди:
   - `supabase/schema.sql` — таблицы, индексы, RLS;
   - `supabase/storage.sql` — публичный bucket для файлов (по умолчанию `plms`);
   - `supabase/seed.sql` — *(необязательно)* демо-данные.
3. В **Project Settings → API** скопируйте:
   - **Project URL**;
   - **anon public** ключ;
   - **service_role** ключ (секретный, только для сервера).

### 2. Настройте переменные окружения

```bash
cp .env.example .env.local
```

Заполните `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_STORAGE_BUCKET=plms
AUTH_SECRET=<сгенерируйте: openssl rand -base64 48>
AUTH_SESSION_MAX_AGE=604800
```

### 3. Установите зависимости и запустите

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

> Если при установке возникают конфликты peer-зависимостей (React 19), используйте
> `npm install --legacy-peer-deps`.

### 4. Создайте аккаунт преподавателя

Перейдите на `/register`. **Первый** созданный аккаунт становится преподавателем (владельцем
экземпляра). После этого открытая регистрация закрывается — последующие аккаунты учеников
создаёт преподаватель из раздела «Ученики» → «Выдать доступ».

---

## Роли

| Раздел              | Преподаватель | Ученик |
| ------------------- | :-----------: | :----: |
| Дашборд             |       ✅      |   ✅   |
| Ученики             |       ✅      |   —    |
| Группы              |       ✅      |   —    |
| Занятия             |       ✅      |   👁   |
| Материалы           |       ✅      |   👁   |
| Домашние задания    |       ✅      |   ✍️   |
| Оплаты              |       ✅      |   —    |
| Статистика          |       ✅      |   —    |
| Настройки           |       ✅      |   —    |

Ученик видит только свои данные (занятия своих групп, свои задания и оценки). Ограничения
дублируются на трёх уровнях: middleware (по ролям), guard-функции в загрузчиках страниц и
проверки внутри Server Actions / сервисов.

---

## Видеозвонки

Встроенного видеосервиса нет. У занятия есть поле `meeting_url` и кнопка
**«Подключиться к занятию»** — поддерживаются Zoom, Google Meet, Telegram, Jitsi и любые внешние
ссылки.

---

## Домашние задания

- **FILE** — ученик загружает файл с решением (Supabase Storage), преподаватель ставит оценку и
  комментарий.
- **QUIZ** — тест с вопросами и правильными ответами; проверяется автоматически (сравнение без
  учёта регистра и пробелов), оценка выставляется в процентах (0–100).

---

## Структура проекта

```
app/
  (auth)/            вход и регистрация
  (app)/             приложение под общим layout (sidebar + header + breadcrumbs)
    dashboard/  students/  groups/  lessons/
    materials/  homework/  payments/  statistics/  settings/
  api/storage/upload route handler для загрузки файлов
components/
  ui/                примитивы shadcn/ui
  layout/            app-shell, sidebar, header, breadcrumbs, user-menu
  shared/            page-header, empty-state, confirm-dialog, file-upload, …
lib/
  auth/              пароли (bcrypt), сессии (jose), guard'ы, доступ по ролям
  db/                Supabase-клиент и типы базы
  validators/        zod-схемы
  utils/             cn, форматирование, helpers
services/            слой доступа к данным (students, groups, lessons, materials,
                     homework, payments, statistics, storage, settings)
types/               доменные типы
supabase/            schema.sql, storage.sql, seed.sql
middleware.ts        защита маршрутов по ролям
```

---

## Безопасность

- pLMS использует **собственную** авторизацию, а не Supabase Auth.
- На всех таблицах включён **RLS без политик** — это полностью блокирует доступ для ролей `anon`
  и `authenticated`. Доступ к данным идёт только с сервера через **service_role** ключ
  (он обходит RLS). Поэтому `SUPABASE_SERVICE_ROLE_KEY` — серверный секрет и **не** попадает в
  браузер.
- Пароли хранятся только в виде bcrypt-хэша.
- Сессия — подписанный JWT в `httpOnly` cookie.

---

## Деплой на Vercel

1. Запушьте репозиторий на GitHub и импортируйте его в Vercel.
2. В **Project Settings → Environment Variables** добавьте те же переменные, что и в `.env.local`.
3. Деплой. Каждому клиенту — отдельный проект Vercel + отдельный проект Supabase.

---

## Скрипты

```bash
npm run dev         # разработка
npm run build       # production-сборка
npm run start       # запуск собранного приложения
npm run lint        # ESLint
npm run type-check  # проверка типов (tsc --noEmit)
```

---

## Примечания и допущения (MVP)

- В качестве реализации bcrypt используется `bcryptjs` (чистый JS — без нативной сборки, работает
  на Vercel из коробки).
- К сущностям добавлены минимально необходимые поля сверх ТЗ: `students.user_id` (привязка логина),
  `students.is_archived` (архив), `quiz_questions.position` (порядок), `created_at`/`submitted_at`
  (сортировка). Запрещённые поля мультитенантности не используются.
- Материалы — общая библиотека (без привязки к группе), как в ТЗ.
- «Посещаемость» в статистике вычисляется как доля проведённых занятий среди завершённых
  (проведённые + отменённые), т.к. отдельной сущности посещаемости в схеме нет.
- Загрузка файлов идёт через Route Handler (`/api/storage/upload`), лимит — 25 МБ.
