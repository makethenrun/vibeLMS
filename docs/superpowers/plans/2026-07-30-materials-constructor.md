# Materials Constructor v1 (Authoring) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn "Материал" from a flat file record into an editable constructor with a strict 5-level hierarchy (Material → Section → Lesson → Module → Items), authorable by a tutor.

**Architecture:** Normalized relational tables (one per hierarchy level; `position` column for order; cascade delete downward), with typed JSONB only at the leaf (`material_items.content`). Drill-down routing (one screen per level, flat route params by globally-unique id, breadcrumbs via parent-lookup). The current flat `materials` table/UI is split off into a separate `files` library so homework file-attachment keeps working.

**Tech Stack:** Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript strict (no `any`), Supabase (service-role, RLS deny-all), zod + react-hook-form, shadcn/ui (Radix), Tiptap (rich text), Vitest (new).

## Global Constraints

- TypeScript strict, **no `any`** (spec + README).
- All DB access is **server-only** via `createServerSupabaseClient()` (service-role); never import `lib/db/supabase` into a client component.
- Every Server Action returns `ActionResult` (`lib/utils/action-result.ts`) — `ok()` / `fail(msg, fieldErrors?)`, never throws to the client.
- Tutor-gated mutations use `getTutorOrNull()`; tutor-gated pages use `requireTutor()`.
- `lib/db/database.types.ts` is **hand-authored** — every schema change must be mirrored there by hand.
- Validation with zod; forms with react-hook-form + `zodResolver`; server field errors mapped with `applyFieldErrors`.
- Russian UI copy (match existing tone: "Добавить", "Сохранить", "Удалить", toast messages).
- Item type enum values verbatim: `INFO`, `CHOICE`, `GAPS`, `FREE`, `MATCH`.
- Position ordering pattern mirrors `quiz_questions.position` (integer, `order by position asc`).
- After any code change verify with `npm run type-check` and `npm run lint`.

---

## File Structure

**New — data/validation:**
- `supabase/migrations/0006_materials_constructor.sql` — files rename + new tables
- `lib/validators/files.ts` — files (renamed from `material.ts`)
- `lib/validators/materials/entities.ts` — section/lesson/module/material title schemas
- `lib/validators/materials/item-content.ts` — discriminated union of item `content` per type
- `lib/validators/materials/index.ts` — re-exports

**New — services:**
- `services/files/files.service.ts` — renamed from `services/materials/materials.service.ts`
- `services/materials/reorder.ts` — pure reorder helper (unit-tested)
- `services/materials/materials.service.ts` — container CRUD (rewritten)
- `services/materials/sections.service.ts`
- `services/materials/lessons.service.ts`
- `services/materials/modules.service.ts`
- `services/materials/items.service.ts`
- `services/materials/breadcrumbs.service.ts` — parent lookups for a section/lesson/module id

**New — UI (constructor):**
- `app/(app)/materials/page.tsx` — materials list (rewritten)
- `app/(app)/materials/actions.ts` — all constructor server actions (rewritten)
- `app/(app)/materials/material-form-dialog.tsx` — create/edit material
- `app/(app)/materials/[materialId]/page.tsx` — overview + sections list
- `app/(app)/materials/sections/[sectionId]/page.tsx` — lessons list
- `app/(app)/materials/lessons/[lessonId]/page.tsx` — modules list
- `app/(app)/materials/modules/[moduleId]/page.tsx` — item editor
- `app/(app)/materials/_components/child-list.tsx` — shared reorderable child-entity list
- `app/(app)/materials/_components/breadcrumbs.tsx` — breadcrumb bar
- `app/(app)/materials/modules/[moduleId]/item-list.tsx` — client item list + add/reorder/delete
- `app/(app)/materials/modules/[moduleId]/item-editors/{info,choice,gaps,free,match}-editor.tsx`
- `components/editor/rich-text-editor.tsx` — Tiptap wrapper

**New — files library UI (moved from current materials):**
- `app/(app)/files/page.tsx`, `file-card.tsx`, `file-dialog.tsx`, `actions.ts`

**Modified:**
- `supabase/schema.sql` — final-state schema
- `lib/db/database.types.ts` — files + materials + 4 new tables
- `types/index.ts` — new row types + view models
- `lib/validators/index.ts` — export files + materials validators
- `components/layout/nav-config.ts` — "Файлы" item; "Материалы" tutor-only
- `lib/auth/route-access.ts` — add `/materials` to tutor-only prefixes
- `app/(app)/homework/page.tsx` — `listMaterials` → `listFiles`
- `package.json` — vitest + tiptap deps, `test` script

---

## Phase 0 — Tooling

### Task 1: Add Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `lib/utils/__tests__/smoke.test.ts` (temporary sanity test, deleted in Step 6)

**Interfaces:**
- Produces: `npm test` runs Vitest; `@/` path alias resolves in tests.

- [ ] **Step 1: Install deps**

```bash
npm install
npm install -D vitest@^2 @vitejs/plugin-react@^4 vite-tsconfig-paths@^5 jsdom@^25
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
  },
});
```

- [ ] **Step 3: Add `test` script to `package.json` scripts**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write smoke test** `lib/utils/__tests__/smoke.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { ok, fail } from "@/lib/utils/action-result";

describe("action-result", () => {
  it("ok wraps data", () => {
    expect(ok()).toEqual({ success: true, data: undefined });
  });
  it("fail carries message", () => {
    expect(fail("x")).toEqual({ success: false, error: "x", fieldErrors: undefined });
  });
});
```

- [ ] **Step 5: Run** `npm test` — Expected: PASS (2 tests), confirms `@/` alias works.

- [ ] **Step 6: Delete smoke test, commit**

```bash
rm lib/utils/__tests__/smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Phase 1 — Data model & validation

### Task 2: Schema migration

**Files:**
- Create: `supabase/migrations/0006_materials_constructor.sql`
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: tables `files`, `materials` (new shape), `material_sections`, `material_lessons`, `material_modules`, `material_items`.

- [ ] **Step 1: Write migration** `supabase/migrations/0006_materials_constructor.sql`

```sql
-- Split flat file library off from the new constructor.
alter table if exists public.materials rename to files;

-- New constructor container.
create table if not exists public.materials (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  cover_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.material_sections (
  id          uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists material_sections_material_id_idx on public.material_sections (material_id);

create table if not exists public.material_lessons (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.material_sections (id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists material_lessons_section_id_idx on public.material_lessons (section_id);

create table if not exists public.material_modules (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.material_lessons (id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists material_modules_lesson_id_idx on public.material_modules (lesson_id);

create table if not exists public.material_items (
  id         uuid primary key default gen_random_uuid(),
  module_id  uuid not null references public.material_modules (id) on delete cascade,
  position   integer not null default 0,
  type       text not null check (type in ('INFO','CHOICE','GAPS','FREE','MATCH')),
  content    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists material_items_module_id_idx on public.material_items (module_id);

alter table public.files             enable row level security;
alter table public.materials         enable row level security;
alter table public.material_sections enable row level security;
alter table public.material_lessons  enable row level security;
alter table public.material_modules  enable row level security;
alter table public.material_items    enable row level security;
```

- [ ] **Step 2: Update `supabase/schema.sql`** — rename the `materials` block to `files` (same columns), then add the six new blocks above (materials container + 4 hierarchy tables) in the same style, and add the six `enable row level security` lines to the RLS section at the bottom. (`schema.sql` is the fresh-install source of truth; keep it consistent with the migration's end state.)

- [ ] **Step 3: Verify SQL parses** — no runner; visually confirm balanced parens and that every `references` target table is declared earlier in the file.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0006_materials_constructor.sql supabase/schema.sql
git commit -m "feat(db): materials constructor tables + files split"
```

### Task 3: Update database.types.ts

**Files:**
- Modify: `lib/db/database.types.ts`

**Interfaces:**
- Produces: typed `Database["public"]["Tables"]` entries: `files`, `materials`, `material_sections`, `material_lessons`, `material_modules`, `material_items`. New exported type `MaterialItemType = "INFO" | "CHOICE" | "GAPS" | "FREE" | "MATCH"`.

- [ ] **Step 1: Add item-type union** near the other unions:

```ts
export type MaterialItemType = "INFO" | "CHOICE" | "GAPS" | "FREE" | "MATCH";
```

- [ ] **Step 2: Rename the existing `materials:` table block to `files:`** (identical Row/Insert/Update columns: `id`, `title`, `file_url`, `material_type`, `created_at`).

- [ ] **Step 3: Add new `materials:` block** with Row/Insert/Update for `{ id, title, description: string|null, cover_url: string|null, created_at, updated_at }` (Insert: all but id/timestamps optional; `title` required).

- [ ] **Step 4: Add `material_sections`, `material_lessons`, `material_modules` blocks** — each Row `{ id, <parent>_id, title, position: number, created_at }`, Insert with `id?`, `position?`, `created_at?`, Relationships `[]`.

- [ ] **Step 5: Add `material_items` block** — Row `{ id, module_id, position: number, type: MaterialItemType, content: Json, created_at, updated_at }`; Insert `{ module_id, type, content?: Json, position?, id?, created_at?, updated_at? }`; Update all optional.

- [ ] **Step 6: Verify + commit**

```bash
npm run type-check
git add lib/db/database.types.ts
git commit -m "feat(types): database types for constructor tables"
```

### Task 4: Item content schemas (TDD)

**Files:**
- Create: `lib/validators/materials/item-content.ts`
- Test: `lib/validators/materials/__tests__/item-content.test.ts`

**Interfaces:**
- Produces:
  - `itemContentSchema` — `z.discriminatedUnion("type", [...])` over the 5 types.
  - Types: `InfoContent`, `ChoiceContent`, `GapsContent`, `FreeContent`, `MatchContent`, `ItemContent`.
  - `defaultContentFor(type: MaterialItemType): ItemContent` — blank valid content for a freshly-added item.

- [ ] **Step 1: Write failing tests** `lib/validators/materials/__tests__/item-content.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { itemContentSchema, defaultContentFor } from "@/lib/validators/materials/item-content";

describe("itemContentSchema", () => {
  it("accepts a valid CHOICE", () => {
    const r = itemContentSchema.safeParse({
      type: "CHOICE",
      question: "2+2?",
      options: ["3", "4"],
      correct: [1],
      multiple: false,
      grading: "STRICT",
    });
    expect(r.success).toBe(true);
  });

  it("rejects CHOICE with a correct index out of range", () => {
    const r = itemContentSchema.safeParse({
      type: "CHOICE", question: "q", options: ["a", "b"],
      correct: [5], multiple: false, grading: "STRICT",
    });
    expect(r.success).toBe(false);
  });

  it("rejects CHOICE with no correct answer", () => {
    const r = itemContentSchema.safeParse({
      type: "CHOICE", question: "q", options: ["a", "b"],
      correct: [], multiple: false, grading: "STRICT",
    });
    expect(r.success).toBe(false);
  });

  it("accepts GAPS with matching blank indices", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS",
      text: "go -> {{1}}, see -> {{2}}",
      blanks: [
        { index: 1, answers: ["went"], options: null },
        { index: 2, answers: ["saw"], options: ["saw", "seen"] },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rejects GAPS when a placeholder has no matching blank", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS", text: "a {{1}} b {{2}}",
      blanks: [{ index: 1, answers: ["x"], options: null }],
    });
    expect(r.success).toBe(false);
  });

  it("accepts MATCH with >=1 pair", () => {
    const r = itemContentSchema.safeParse({
      type: "MATCH", prompt: null, pairs: [{ left: "dog", right: "собака" }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects MATCH with zero pairs", () => {
    const r = itemContentSchema.safeParse({ type: "MATCH", prompt: null, pairs: [] });
    expect(r.success).toBe(false);
  });

  it("accepts FREE with optional sample", () => {
    expect(itemContentSchema.safeParse({ type: "FREE", prompt: "Опишите", sampleAnswer: null }).success).toBe(true);
  });

  it("accepts INFO with a doc object", () => {
    expect(itemContentSchema.safeParse({ type: "INFO", doc: { type: "doc", content: [] } }).success).toBe(true);
  });

  it("defaultContentFor returns valid content for each type", () => {
    for (const t of ["INFO", "CHOICE", "GAPS", "FREE", "MATCH"] as const) {
      expect(itemContentSchema.safeParse(defaultContentFor(t)).success).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run** `npx vitest run lib/validators/materials` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `lib/validators/materials/item-content.ts`

```ts
import { z } from "zod";
import type { MaterialItemType } from "@/lib/db/database.types";

const nonEmpty = z.string().trim().min(1, "Заполните поле");

export const infoContentSchema = z.object({
  type: z.literal("INFO"),
  doc: z.record(z.unknown()), // Tiptap JSON document
});

export const choiceContentSchema = z
  .object({
    type: z.literal("CHOICE"),
    question: nonEmpty.max(1000),
    options: z.array(nonEmpty.max(500)).min(2, "Минимум 2 варианта").max(10),
    correct: z.array(z.number().int().nonnegative()).min(1, "Отметьте правильный ответ"),
    multiple: z.boolean(),
    grading: z.enum(["STRICT", "PARTIAL"]),
  })
  .superRefine((v, ctx) => {
    if (v.correct.some((i) => i >= v.options.length)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Правильный ответ вне списка", path: ["correct"] });
    }
    if (!v.multiple && v.correct.length !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Для одиночного выбора ровно один ответ", path: ["correct"] });
    }
  });

const blankSchema = z.object({
  index: z.number().int().positive(),
  answers: z.array(nonEmpty.max(200)).min(1, "Укажите ответ"),
  options: z.array(nonEmpty.max(200)).min(2).nullable(),
});

export const gapsContentSchema = z
  .object({
    type: z.literal("GAPS"),
    text: nonEmpty.max(4000),
    blanks: z.array(blankSchema).min(1, "Добавьте хотя бы один пропуск"),
  })
  .superRefine((v, ctx) => {
    const placeholders = [...v.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    const blankIndices = new Set(v.blanks.map((b) => b.index));
    for (const p of placeholders) {
      if (!blankIndices.has(p)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Пропуск {{${p}}} без ответа`, path: ["blanks"] });
      }
    }
    for (const b of v.blanks) {
      if (!placeholders.includes(b.index)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Ответ ${b.index} без пропуска в тексте`, path: ["blanks"] });
      }
    }
  });

export const freeContentSchema = z.object({
  type: z.literal("FREE"),
  prompt: nonEmpty.max(2000),
  sampleAnswer: z.string().trim().max(4000).nullable(),
});

export const matchContentSchema = z.object({
  type: z.literal("MATCH"),
  prompt: z.string().trim().max(1000).nullable(),
  pairs: z.array(z.object({ left: nonEmpty.max(300), right: nonEmpty.max(300) })).min(1, "Добавьте пару").max(20),
});

export const itemContentSchema = z.discriminatedUnion("type", [
  infoContentSchema,
  choiceContentSchema,
  gapsContentSchema,
  freeContentSchema,
  matchContentSchema,
]);

export type InfoContent = z.infer<typeof infoContentSchema>;
export type ChoiceContent = z.infer<typeof choiceContentSchema>;
export type GapsContent = z.infer<typeof gapsContentSchema>;
export type FreeContent = z.infer<typeof freeContentSchema>;
export type MatchContent = z.infer<typeof matchContentSchema>;
export type ItemContent = z.infer<typeof itemContentSchema>;

export function defaultContentFor(type: MaterialItemType): ItemContent {
  switch (type) {
    case "INFO":
      return { type: "INFO", doc: { type: "doc", content: [{ type: "paragraph" }] } };
    case "CHOICE":
      return { type: "CHOICE", question: "Вопрос", options: ["Вариант 1", "Вариант 2"], correct: [0], multiple: false, grading: "STRICT" };
    case "GAPS":
      return { type: "GAPS", text: "Пример с {{1}}.", blanks: [{ index: 1, answers: ["ответ"], options: null }] };
    case "FREE":
      return { type: "FREE", prompt: "Задание", sampleAnswer: null };
    case "MATCH":
      return { type: "MATCH", prompt: null, pairs: [{ left: "A", right: "Б" }] };
  }
}
```

- [ ] **Step 4: Run** `npx vitest run lib/validators/materials` — Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add lib/validators/materials/item-content.ts lib/validators/materials/__tests__/item-content.test.ts
git commit -m "feat(validators): material item content schemas"
```

### Task 5: Entity schemas + validator wiring

**Files:**
- Create: `lib/validators/materials/entities.ts`
- Create: `lib/validators/materials/index.ts`
- Rename: `lib/validators/material.ts` → `lib/validators/files.ts`
- Modify: `lib/validators/index.ts`

**Interfaces:**
- Produces (`entities.ts`): `materialSchema` `{ title, description, coverUrl }`; `titleSchema` `{ title }` (reused for section/lesson/module); `itemUpsertSchema` `{ type, content }` (content validated by `itemContentSchema`). Inferred types `MaterialInput`, `TitleInput`, `ItemUpsertInput`.
- Produces (`files.ts`): `fileSchema` + `FileInput` (the former `materialSchema`/`MaterialInput`, renamed).

- [ ] **Step 1: Rename validator to files** — `git mv lib/validators/material.ts lib/validators/files.ts`. Inside, rename `materialSchema` → `fileSchema` and `MaterialInput` → `FileInput` (fields unchanged: `title`, `materialType`, `fileUrl`).

- [ ] **Step 2: Create** `lib/validators/materials/entities.ts`

```ts
import { z } from "zod";
import { itemContentSchema } from "./item-content";

const title = z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов");

export const titleSchema = z.object({ title });
export type TitleInput = z.infer<typeof titleSchema>;

export const materialSchema = z.object({
  title,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  coverUrl: z.string().trim().url("Некорректная ссылка").max(1000).optional().or(z.literal("")),
});
export type MaterialInput = z.infer<typeof materialSchema>;

export const itemUpsertSchema = z.object({ content: itemContentSchema });
export type ItemUpsertInput = z.infer<typeof itemUpsertSchema>;
```

- [ ] **Step 3: Create** `lib/validators/materials/index.ts`

```ts
export * from "./entities";
export * from "./item-content";
```

- [ ] **Step 4: Update** `lib/validators/index.ts` — replace `export * from "./material";` with `export * from "./files";` and add `export * from "./materials";`.

- [ ] **Step 5: Verify + commit**

```bash
npm run type-check
git add lib/validators
git commit -m "feat(validators): files + material entity schemas"
```

> NOTE: `type-check` will now report errors in `services/materials/materials.service.ts`, `app/(app)/materials/actions.ts`, and `app/(app)/homework/page.tsx` that reference the old `materialSchema`/`materials` table. These are fixed in Phase 2. If running type-check in isolation here, expect those specific errors and proceed.

### Task 6: Domain row types + view models

**Files:**
- Modify: `types/index.ts`

**Interfaces:**
- Produces row types: `FileRow` (aliased `Material`→ keep name `FileRecord`), `MaterialRow`, `SectionRow`, `LessonRow`, `ModuleRow`, `ItemRow`. View models: `MaterialWithCounts`, `SectionWithCounts`, etc., and `Breadcrumb`.

- [ ] **Step 1: Edit** `types/index.ts` — under the row-types block:

```ts
export type FileRecord = Tables["files"]["Row"];
export type MaterialRow = Tables["materials"]["Row"];
export type SectionRow = Tables["material_sections"]["Row"];
export type LessonRow = Tables["material_lessons"]["Row"];
export type ModuleRow = Tables["material_modules"]["Row"];
export type ItemRow = Tables["material_items"]["Row"];
```

Remove the old `export type Material = Tables["materials"]["Row"];` line (the flat one) — replaced by `FileRecord` for the files library and `MaterialRow` for the container.

- [ ] **Step 2: Add view models** (append to composite section):

```ts
export interface MaterialWithCounts extends MaterialRow {
  sectionCount: number;
}
export interface Breadcrumb {
  label: string;
  href: string;
}
export interface MaterialTree {
  material: MaterialRow;
}
```

Add `MaterialItemType` to the re-export list at the top (`export type { ..., MaterialItemType } from "@/lib/db/database.types";`).

- [ ] **Step 3: Verify + commit**

```bash
npm run type-check   # expect only the known Phase-2 errors noted in Task 5
git add types/index.ts
git commit -m "feat(types): material row types and view models"
```

---

## Phase 2 — Files split (keep homework working)

### Task 7: files.service

**Files:**
- Rename: `services/materials/materials.service.ts` → `services/files/files.service.ts`
- Test: none (thin DB wrapper)

**Interfaces:**
- Produces: `listFiles(db): Promise<FileRecord[]>`, `getFile(db, id)`, `createFile(db, input: FileInput)`, `deleteFile(db, id)` — all against the `files` table.

- [ ] **Step 1:** `git mv services/materials/materials.service.ts services/files/files.service.ts`.

- [ ] **Step 2:** In the moved file: import `FileInput` from validators and `FileRecord` from types; rename functions `listMaterials→listFiles`, `getMaterial→getFile`, `createMaterial→createFile`, `deleteMaterial→deleteFile`; change `.from("materials")` → `.from("files")`; insert uses `input.fileUrl` / `input.materialType` (unchanged fields).

- [ ] **Step 3: Commit**

```bash
git add services
git commit -m "refactor(files): rename materials service to files service"
```

### Task 8: /files UI (moved library)

**Files:**
- Create: `app/(app)/files/page.tsx`, `app/(app)/files/file-card.tsx`, `app/(app)/files/file-dialog.tsx`, `app/(app)/files/actions.ts`
- Delete (later, in Task 19): current `app/(app)/materials/*` flat-file UI

**Interfaces:**
- Consumes: `listFiles`, `createFile`, `getFile`, `deleteFile`; `fileSchema`/`FileInput`.
- Produces: `/files` route rendering the former materials library; server actions `createFileAction`, `deleteFileAction`.

- [ ] **Step 1:** Copy the current `app/(app)/materials/{page,material-card,material-dialog,actions}.tsx` into `app/(app)/files/` as `{page,file-card,file-dialog,actions}.tsx`. Rename symbols Material→File (component/action names, imports), point imports at `@/services/files/files.service` and `@/lib/validators` (`fileSchema`, `FileInput`), title copy "Материалы"→"Файлы", metadata title "Файлы", `revalidatePath("/materials")`→`revalidatePath("/files")`. Keep `FileUpload folder="materials"` (storage folder name is unchanged).

- [ ] **Step 2: Verify** `npm run type-check` — the `/files` route should type-check (materials route still old; fixed in Task 19). `npm run lint`.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/files
git commit -m "feat(files): file library UI at /files"
```

### Task 9: Homework wiring + nav + route access

**Files:**
- Modify: `app/(app)/homework/page.tsx`
- Modify: `components/layout/nav-config.ts`
- Modify: `lib/auth/route-access.ts`

**Interfaces:**
- Consumes: `listFiles`.

- [ ] **Step 1:** In `app/(app)/homework/page.tsx` change the import `{ listMaterials } from "@/services/materials/materials.service"` → `{ listFiles } from "@/services/files/files.service"`, and the call `listMaterials(db)` → `listFiles(db)`. The mapped shape (`id`, `title`, `fileUrl: material.file_url`) is unchanged — rename local var `materials`→`files`, `material`→`file`.

- [ ] **Step 2:** In `components/layout/nav-config.ts`: add `FileText` to the lucide import; keep the "Материалы" item (`/materials`, `Library`) but change its `roles` to `TUTOR_ONLY`; add a new item after it: `{ label: "Файлы", href: "/files", icon: FileText, roles: BOTH }`.

- [ ] **Step 3:** In `lib/auth/route-access.ts` add `"/materials"` to `TUTOR_ONLY_PREFIXES`.

- [ ] **Step 4: Verify + commit**

```bash
npm run type-check && npm run lint
git add app/\(app\)/homework/page.tsx components/layout/nav-config.ts lib/auth/route-access.ts
git commit -m "feat: point homework + nav at files library, gate /materials to tutors"
```

---

## Phase 3 — Reorder helper + services

### Task 10: Reorder pure helper (TDD)

**Files:**
- Create: `services/materials/reorder.ts`
- Test: `services/materials/__tests__/reorder.test.ts`

**Interfaces:**
- Produces: `swapForMove<T extends { id: string; position: number }>(rows: T[], id: string, direction: "up" | "down"): Array<{ id: string; position: number }>` — returns the (≤2) rows whose position must change, or `[]` at a boundary. Rows may arrive unsorted.

- [ ] **Step 1: Write failing tests** `services/materials/__tests__/reorder.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { swapForMove } from "@/services/materials/reorder";

const rows = [
  { id: "a", position: 0 },
  { id: "b", position: 1 },
  { id: "c", position: 2 },
];

describe("swapForMove", () => {
  it("moves middle up: swaps with previous", () => {
    expect(swapForMove(rows, "b", "up")).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
    ]);
  });
  it("moves middle down: swaps with next", () => {
    expect(swapForMove(rows, "b", "down")).toEqual([
      { id: "b", position: 2 },
      { id: "c", position: 1 },
    ]);
  });
  it("no-op moving first up", () => {
    expect(swapForMove(rows, "a", "up")).toEqual([]);
  });
  it("no-op moving last down", () => {
    expect(swapForMove(rows, "c", "down")).toEqual([]);
  });
  it("handles unsorted input", () => {
    const shuffled = [rows[2], rows[0], rows[1]];
    expect(swapForMove(shuffled, "a", "down")).toEqual([
      { id: "a", position: 1 },
      { id: "b", position: 0 },
    ]);
  });
  it("returns [] for unknown id", () => {
    expect(swapForMove(rows, "z", "up")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run services/materials` — Expected: FAIL.

- [ ] **Step 3: Implement** `services/materials/reorder.ts`

```ts
export function swapForMove<T extends { id: string; position: number }>(
  rows: T[],
  id: string,
  direction: "up" | "down",
): Array<{ id: string; position: number }> {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((r) => r.id === id);
  if (idx === -1) return [];
  const neighbourIdx = direction === "up" ? idx - 1 : idx + 1;
  if (neighbourIdx < 0 || neighbourIdx >= sorted.length) return [];
  const current = sorted[idx];
  const neighbour = sorted[neighbourIdx];
  return [
    { id: current.id, position: neighbour.position },
    { id: neighbour.id, position: current.position },
  ];
}
```

- [ ] **Step 4: Run** `npx vitest run services/materials` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/materials/reorder.ts services/materials/__tests__/reorder.test.ts
git commit -m "feat(materials): pure reorder helper"
```

### Task 11: materials.service (container)

**Files:**
- Create: `services/materials/materials.service.ts`

**Interfaces:**
- Consumes: `MaterialInput`, `MaterialRow`, `MaterialWithCounts`.
- Produces:
  - `listMaterials(db): Promise<MaterialWithCounts[]>` (order by `created_at desc`, `sectionCount` via count)
  - `getMaterial(db, id): Promise<MaterialRow | null>`
  - `createMaterial(db, input): Promise<MaterialRow>`
  - `updateMaterial(db, id, input): Promise<void>` (sets `updated_at = now()`)
  - `deleteMaterial(db, id): Promise<void>`

- [ ] **Step 1: Implement** — follow the existing service style (throw on `error`). For `listMaterials`, select materials then, for section counts, run `db.from("material_sections").select("material_id")` and tally in JS (avoids per-row queries). Normalize empty `description`/`coverUrl` to `null` on write. Set `updated_at: new Date().toISOString()` in `updateMaterial`.

```ts
import "server-only";
import type { Db } from "@/lib/db/supabase";
import type { MaterialInput } from "@/lib/validators";
import type { MaterialRow, MaterialWithCounts } from "@/types";

function nullable(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

export async function listMaterials(db: Db): Promise<MaterialWithCounts[]> {
  const { data, error } = await db.from("materials").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const materials = data ?? [];
  const { data: sections } = await db.from("material_sections").select("material_id");
  const counts = new Map<string, number>();
  for (const s of sections ?? []) counts.set(s.material_id, (counts.get(s.material_id) ?? 0) + 1);
  return materials.map((m) => ({ ...m, sectionCount: counts.get(m.id) ?? 0 }));
}

export async function getMaterial(db: Db, id: string): Promise<MaterialRow | null> {
  const { data } = await db.from("materials").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function createMaterial(db: Db, input: MaterialInput): Promise<MaterialRow> {
  const { data, error } = await db
    .from("materials")
    .insert({ title: input.title, description: nullable(input.description), cover_url: nullable(input.coverUrl) })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMaterial(db: Db, id: string, input: MaterialInput): Promise<void> {
  const { error } = await db
    .from("materials")
    .update({ title: input.title, description: nullable(input.description), cover_url: nullable(input.coverUrl), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMaterial(db: Db, id: string): Promise<void> {
  const { error } = await db.from("materials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 2: Verify + commit**

```bash
npm run type-check
git add services/materials/materials.service.ts
git commit -m "feat(materials): container service"
```

### Task 12: sections.service

**Files:**
- Create: `services/materials/sections.service.ts`

**Interfaces:**
- Produces: `listSections(db, materialId): Promise<SectionRow[]>` (order by position); `createSection(db, materialId, title): Promise<SectionRow>` (position = max+1); `updateSection(db, id, title)`; `deleteSection(db, id)`; `moveSection(db, id, direction)`.

- [ ] **Step 1: Implement** using `swapForMove`. Generic pattern (repeat per level):

```ts
import "server-only";
import type { Db } from "@/lib/db/supabase";
import type { SectionRow } from "@/types";
import { swapForMove } from "./reorder";

export async function listSections(db: Db, materialId: string): Promise<SectionRow[]> {
  const { data, error } = await db.from("material_sections").select("*")
    .eq("material_id", materialId).order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSection(db: Db, materialId: string, title: string): Promise<SectionRow> {
  const existing = await listSections(db, materialId);
  const position = existing.length === 0 ? 0 : Math.max(...existing.map((s) => s.position)) + 1;
  const { data, error } = await db.from("material_sections")
    .insert({ material_id: materialId, title, position }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSection(db: Db, id: string, title: string): Promise<void> {
  const { error } = await db.from("material_sections").update({ title }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSection(db: Db, id: string): Promise<void> {
  const { error } = await db.from("material_sections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveSection(db: Db, id: string, direction: "up" | "down"): Promise<void> {
  const { data: row } = await db.from("material_sections").select("material_id").eq("id", id).maybeSingle();
  if (!row) return;
  const siblings = await listSections(db, row.material_id);
  const changes = swapForMove(siblings, id, direction);
  for (const c of changes) {
    const { error } = await db.from("material_sections").update({ position: c.position }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
```

- [ ] **Step 2: Verify + commit**

```bash
npm run type-check
git add services/materials/sections.service.ts
git commit -m "feat(materials): sections service"
```

### Task 13: lessons.service

**Files:** Create `services/materials/lessons.service.ts`

**Interfaces:** `listLessons(db, sectionId)`, `createLesson(db, sectionId, title)`, `updateLesson(db, id, title)`, `deleteLesson(db, id)`, `moveLesson(db, id, direction)`.

- [ ] **Step 1:** Copy Task 12's implementation, replacing `material_sections`→`material_lessons`, `material_id`→`section_id`, `SectionRow`→`LessonRow`, function names Section→Lesson, and the moveLesson parent lookup selects `section_id`.
- [ ] **Step 2: Verify + commit** (`npm run type-check`; commit `feat(materials): lessons service`).

### Task 14: modules.service

**Files:** Create `services/materials/modules.service.ts`

**Interfaces:** `listModules(db, lessonId)`, `createModule(db, lessonId, title)`, `updateModule(db, id, title)`, `deleteModule(db, id)`, `moveModule(db, id, direction)`.

- [ ] **Step 1:** Copy Task 12, replacing with `material_modules` / `lesson_id` / `ModuleRow` / Module.
- [ ] **Step 2: Verify + commit** (`feat(materials): modules service`).

### Task 15: items.service

**Files:** Create `services/materials/items.service.ts`

**Interfaces:**
- Consumes: `ItemContent` (validated), `ItemRow`, `MaterialItemType`.
- Produces: `listItems(db, moduleId): Promise<ItemRow[]>`; `createItem(db, moduleId, content: ItemContent): Promise<ItemRow>` (type derived from `content.type`, position = max+1); `updateItemContent(db, id, content: ItemContent): Promise<void>` (sets `updated_at`); `deleteItem(db, id)`; `moveItem(db, id, direction)`.

- [ ] **Step 1: Implement** — same reorder pattern; `content` stored as-is (already validated in the action). `type` column = `content.type`.

```ts
import "server-only";
import type { Db } from "@/lib/db/supabase";
import type { ItemRow } from "@/types";
import type { ItemContent } from "@/lib/validators";
import { swapForMove } from "./reorder";

export async function listItems(db: Db, moduleId: string): Promise<ItemRow[]> {
  const { data, error } = await db.from("material_items").select("*")
    .eq("module_id", moduleId).order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createItem(db: Db, moduleId: string, content: ItemContent): Promise<ItemRow> {
  const existing = await listItems(db, moduleId);
  const position = existing.length === 0 ? 0 : Math.max(...existing.map((i) => i.position)) + 1;
  const { data, error } = await db.from("material_items")
    .insert({ module_id: moduleId, type: content.type, content, position }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateItemContent(db: Db, id: string, content: ItemContent): Promise<void> {
  const { error } = await db.from("material_items")
    .update({ type: content.type, content, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteItem(db: Db, id: string): Promise<void> {
  const { error } = await db.from("material_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveItem(db: Db, id: string, direction: "up" | "down"): Promise<void> {
  const { data: row } = await db.from("material_items").select("module_id").eq("id", id).maybeSingle();
  if (!row) return;
  const siblings = await listItems(db, row.module_id);
  const changes = swapForMove(siblings, id, direction);
  for (const c of changes) {
    const { error } = await db.from("material_items").update({ position: c.position }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
```

- [ ] **Step 2: Verify + commit** (`npm run type-check`; `feat(materials): items service`).

### Task 16: breadcrumbs.service

**Files:** Create `services/materials/breadcrumbs.service.ts`

**Interfaces:**
- Produces: `sectionCrumbs(db, sectionId)`, `lessonCrumbs(db, lessonId)`, `moduleCrumbs(db, moduleId)` — each returns `{ crumbs: Breadcrumb[]; parentId: string; title: string } | null`, walking up to the material. Used by drill-down pages for the breadcrumb bar and the "back"/parent link.

- [ ] **Step 1: Implement** — join upward. Example for module:

```ts
import "server-only";
import type { Db } from "@/lib/db/supabase";
import type { Breadcrumb } from "@/types";

export interface CrumbResult { crumbs: Breadcrumb[]; parentId: string; title: string; }

export async function moduleCrumbs(db: Db, moduleId: string): Promise<CrumbResult | null> {
  const { data: mod } = await db.from("material_modules").select("id, title, lesson_id").eq("id", moduleId).maybeSingle();
  if (!mod) return null;
  const { data: lesson } = await db.from("material_lessons").select("id, title, section_id").eq("id", mod.lesson_id).maybeSingle();
  if (!lesson) return null;
  const { data: section } = await db.from("material_sections").select("id, title, material_id").eq("id", lesson.section_id).maybeSingle();
  if (!section) return null;
  const { data: material } = await db.from("materials").select("id, title").eq("id", section.material_id).maybeSingle();
  if (!material) return null;
  return {
    parentId: lesson.id,
    title: mod.title,
    crumbs: [
      { label: "Материалы", href: "/materials" },
      { label: material.title, href: `/materials/${material.id}` },
      { label: section.title, href: `/materials/sections/${section.id}` },
      { label: lesson.title, href: `/materials/lessons/${lesson.id}` },
      { label: mod.title, href: `/materials/modules/${mod.id}` },
    ],
  };
}
```

Implement `sectionCrumbs` (material → section) and `lessonCrumbs` (material → section → lesson) analogously (shorter crumb chains, `parentId` = the material id / section id respectively).

- [ ] **Step 2: Verify + commit** (`npm run type-check`; `feat(materials): breadcrumb lookups`).

---

## Phase 4 — Server actions

### Task 17: Constructor server actions

**Files:** Create `app/(app)/materials/actions.ts` (overwrites the old flat-material actions).

**Interfaces:**
- Produces (all `Promise<ActionResult>` unless noted): material `createMaterialAction(input)`, `updateMaterialAction(id, input)`, `deleteMaterialAction(id)`; section `createSectionAction(materialId, title)`, `updateSectionAction(id, title)`, `deleteSectionAction(id)`, `moveSectionAction(id, dir)`; same shape for lesson (`…(sectionId, title)` / id) and module (`…(lessonId, title)`); item `createItemAction(moduleId, content: unknown)`, `updateItemAction(id, moduleId, content: unknown)`, `deleteItemAction(id)`, `moveItemAction(id, dir)`.
- Each action guards with `getTutorOrNull()`, validates, calls the service, `revalidatePath` on the affected route, returns `ok()`/`fail()`.

- [ ] **Step 1: Implement** — pattern per action (title-based example + item example shown; replicate for all):

```ts
"use server";
import { revalidatePath } from "next/cache";
import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { titleSchema, materialSchema, itemContentSchema, type MaterialInput } from "@/lib/validators";
import * as materials from "@/services/materials/materials.service";
import * as sections from "@/services/materials/sections.service";
import * as lessons from "@/services/materials/lessons.service";
import * as modules from "@/services/materials/modules.service";
import * as items from "@/services/materials/items.service";

type Dir = "up" | "down";

export async function createSectionAction(materialId: string, title: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const parsed = titleSchema.safeParse({ title });
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try { await sections.createSection(db, materialId, parsed.data.title); }
  catch (e) { return fail(getErrorMessage(e)); }
  revalidatePath(`/materials/${materialId}`);
  return ok();
}

export async function moveSectionAction(id: string, direction: Dir): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try { await sections.moveSection(db, id, direction); } catch (e) { return fail(getErrorMessage(e)); }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function createItemAction(moduleId: string, content: unknown): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const parsed = itemContentSchema.safeParse(content);
  if (!parsed.success) return fail("Проверьте упражнение", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try { await items.createItem(db, moduleId, parsed.data); } catch (e) { return fail(getErrorMessage(e)); }
  revalidatePath(`/materials/modules/${moduleId}`);
  return ok();
}
```

Notes for the remaining actions:
- `createMaterialAction`/`updateMaterialAction` validate with `materialSchema`; revalidate `/materials` (and `/materials/${id}` on update).
- `updateSectionAction`/`updateLessonAction`/`updateModuleAction` validate with `titleSchema`.
- Move/delete actions have no body validation; revalidate the parent list route. For move actions where the parent route id isn't passed, use `revalidatePath("/materials", "layout")` to refresh the subtree.
- `updateItemAction`/`createItemAction` validate `content` with `itemContentSchema`; revalidate `/materials/modules/${moduleId}` (pass `moduleId` to `updateItemAction` too — signature: `updateItemAction(id, moduleId, content)`).

- [ ] **Step 2: Verify + commit**

```bash
npm run type-check && npm run lint
git add app/\(app\)/materials/actions.ts
git commit -m "feat(materials): constructor server actions"
```

---

## Phase 5 — Rich text editor

### Task 18: Tiptap editor component

**Files:**
- Modify: `package.json`
- Create: `components/editor/rich-text-editor.tsx`
- Create: `components/editor/rich-text-toolbar.tsx`

**Interfaces:**
- Produces: `<RichTextEditor value={JSONContent} onChange={(doc: Record<string, unknown>) => void} />` — a controlled Tiptap editor (StarterKit + Link + Image) with a toolbar (bold, italic, headings, bullet/ordered list, link, insert image via `/api/storage/upload`). Emits the Tiptap JSON document.

- [ ] **Step 1: Install**

```bash
npm install @tiptap/react@^2 @tiptap/starter-kit@^2 @tiptap/extension-link@^2 @tiptap/extension-image@^2
```

- [ ] **Step 2: Implement** `components/editor/rich-text-editor.tsx` — `"use client"`; `useEditor({ extensions: [StarterKit, Link.configure({ openOnClick: false }), Image], content: value, onUpdate: ({ editor }) => onChange(editor.getJSON()) })`; render `<RichTextToolbar editor={editor} />` + `<EditorContent editor={editor} className="prose ..." />`. Image insert: file input → POST to `/api/storage/upload` (folder `"materials"`, same as `FileUpload`) → `editor.chain().focus().setImage({ src: url }).run()`. Guard against `editor === null`.

- [ ] **Step 3: Implement** `components/editor/rich-text-toolbar.tsx` — buttons calling `editor.chain().focus().toggleBold().run()` etc.; use `lucide-react` icons (`Bold`, `Italic`, `Heading2`, `List`, `ListOrdered`, `Link2`, `ImagePlus`) and existing `Button` variant `ghost`/`size="sm"`.

- [ ] **Step 4: Verify + commit**

```bash
npm run type-check && npm run lint
git add package.json package-lock.json components/editor
git commit -m "feat(editor): Tiptap rich-text editor"
```

---

## Phase 6 — Constructor UI

> All pages are Server Components that guard with `requireTutor()`, build a `db`, fetch, and render. Mutating widgets are client components calling the Phase-4 actions, showing `toast` (sonner) on result, and calling `router.refresh()` after success. Mirror existing patterns in `app/(app)/lessons/*` and `app/(app)/homework/*`.

### Task 19: Materials list page + material form

**Files:**
- Overwrite: `app/(app)/materials/page.tsx`
- Create: `app/(app)/materials/material-form-dialog.tsx`
- Create: `app/(app)/materials/material-card.tsx`
- Delete: old `app/(app)/materials/material-dialog.tsx` (flat-file version, now at `/files`)

**Interfaces:**
- Consumes: `listMaterials`, `createMaterialAction`, `updateMaterialAction`, `deleteMaterialAction`, `materialSchema`.

- [ ] **Step 1: Overwrite** `page.tsx` — `requireTutor()`; `listMaterials(db)`; `PageHeader title="Материалы" description="Конструктор учебных материалов."` with a `<MaterialFormDialog>` "Создать материал" action; grid of `<MaterialCard>` linking to `/materials/${m.id}`, showing `sectionCount` ("Разделов: N"); `EmptyState` when empty (icon `Library`).

- [ ] **Step 2: Create** `material-form-dialog.tsx` — `"use client"`; react-hook-form + `zodResolver(materialSchema)`; fields title, description (textarea), coverUrl (optional). On submit call create or (when `material` prop present) update; `applyFieldErrors` on failure; `toast.success`; `router.refresh()`; close dialog. Mirror the old `material-dialog.tsx` structure.

- [ ] **Step 3: Create** `material-card.tsx` — `"use client"` card with title, section count, edit (opens `MaterialFormDialog` with `material`), delete (confirm → `deleteMaterialAction`). Mirror `app/(app)/files/file-card.tsx`.

- [ ] **Step 4: Verify + commit**

```bash
rm "app/(app)/materials/material-dialog.tsx"
npm run type-check && npm run lint
git add app/\(app\)/materials
git commit -m "feat(materials): materials list + form"
```

### Task 20: Shared child-list + material overview page

**Files:**
- Create: `app/(app)/materials/_components/child-list.tsx`
- Create: `app/(app)/materials/_components/breadcrumbs.tsx`
- Create: `app/(app)/materials/[materialId]/page.tsx`

**Interfaces:**
- Produces: `<ChildList items={{id,title,href}[]} onCreate onRename onDelete onMove createLabel emptyLabel />` — a client component rendering an ordered list with ↑/↓ (calls `onMove(id, dir)`), inline rename, delete-confirm, and an "add" input/dialog. Reused by section/lesson/module pages. `<Breadcrumbs crumbs={Breadcrumb[]} />` renders the bar.
- Consumes: `getMaterial`, `listSections`, section actions.

- [ ] **Step 1: Create** `_components/child-list.tsx` — `"use client"`. Props: `items: { id: string; title: string; href: string }[]`, `createLabel: string`, `emptyLabel: string`, and async callbacks `onCreate(title)`, `onRename(id, title)`, `onDelete(id)`, `onMove(id, "up"|"down")` each returning `ActionResult`. Render each row: drag-handle-less, `↑`/`↓` buttons (disabled at ends), a `Link` to `href`, an inline rename (pencil → input), delete (trash → confirm). "Add" row with an input + button. After any successful action `toast.success` + `router.refresh()`; on failure `toast.error(result.error)`. Use `ChevronUp`/`ChevronDown`/`Pencil`/`Trash2` icons.

- [ ] **Step 2: Create** `_components/breadcrumbs.tsx` — `"use client"` or server; maps `crumbs` to `<Link>`s separated by `/`, last one non-link muted.

- [ ] **Step 3: Create** `[materialId]/page.tsx` — `requireTutor()`; `getMaterial(db, materialId)` → `notFound()` if null; `listSections(db, materialId)`. Render `<Breadcrumbs crumbs={[{Материалы,/materials},{title,#}]} />`, `PageHeader` with material title + an edit button (`MaterialFormDialog`), then `<ChildList items={sections.map(s => ({id:s.id, title:s.title, href:`/materials/sections/${s.id}`}))} createLabel="Добавить раздел" emptyLabel="Пока нет разделов" onCreate={...} .../>`. The callbacks are thin `"use server"`-bound wrappers or client-imported actions: pass server actions directly (they're already server actions) — wrap `onCreate={(t) => createSectionAction(materialId, t)}` inside a small client wrapper file if needed to bind `materialId`.

  > Binding note: `ChildList` is a client component; pass it already-bound async functions. Create `app/(app)/materials/[materialId]/section-list.tsx` (`"use client"`) that imports the section actions and renders `<ChildList>` with `materialId` closed over. The page renders `<SectionList materialId={...} sections={...} />`.

- [ ] **Step 4: Verify + commit**

```bash
npm run type-check && npm run lint
git add app/\(app\)/materials
git commit -m "feat(materials): overview page + reusable child list"
```

### Task 21: Section page (lessons)

**Files:**
- Create: `app/(app)/materials/sections/[sectionId]/page.tsx`
- Create: `app/(app)/materials/sections/[sectionId]/lesson-list.tsx`

**Interfaces:** Consumes `sectionCrumbs`, `listLessons`, lesson actions.

- [ ] **Step 1:** Page: `requireTutor()`; `sectionCrumbs(db, sectionId)` → `notFound()` if null; `listLessons(db, sectionId)`. Render `<Breadcrumbs crumbs={crumbs} />`, `PageHeader title={section title}`, `<LessonList sectionId={sectionId} lessons={lessons} />`.
- [ ] **Step 2:** `lesson-list.tsx` (`"use client"`): `<ChildList items={lessons→{id,title,href:`/materials/lessons/${id}`}} createLabel="Добавить урок" emptyLabel="Пока нет уроков" onCreate={(t)=>createLessonAction(sectionId,t)} onRename={updateLessonAction} onDelete={deleteLessonAction} onMove={moveLessonAction} />`.
- [ ] **Step 3: Verify + commit** (`feat(materials): section page`).

### Task 22: Lesson page (modules)

**Files:**
- Create: `app/(app)/materials/lessons/[lessonId]/page.tsx`
- Create: `app/(app)/materials/lessons/[lessonId]/module-list.tsx`

**Interfaces:** Consumes `lessonCrumbs`, `listModules`, module actions.

- [ ] **Step 1:** Page mirrors Task 21 with `lessonCrumbs`, `listModules`, module href `/materials/modules/${id}`.
- [ ] **Step 2:** `module-list.tsx` mirrors `lesson-list.tsx` with module actions and `createLabel="Добавить модуль"`, `emptyLabel="Пока нет модулей"`.
- [ ] **Step 3: Verify + commit** (`feat(materials): lesson page`).

### Task 23: Module editor shell + item list

**Files:**
- Create: `app/(app)/materials/modules/[moduleId]/page.tsx`
- Create: `app/(app)/materials/modules/[moduleId]/item-list.tsx`
- Create: `app/(app)/materials/modules/[moduleId]/add-item-menu.tsx`

**Interfaces:**
- Consumes: `moduleCrumbs`, `listItems`, `createItemAction`, `deleteItemAction`, `moveItemAction`, `updateItemAction`, `defaultContentFor`, item-editor components (Task 24-28).
- Produces: `<ItemList moduleId items={ItemRow[]} />` — ordered items, each rendered by its type-specific editor; ↑/↓/delete controls; an "add item" menu that picks a type and calls `createItemAction(moduleId, defaultContentFor(type))`.

- [ ] **Step 1:** Page: `requireTutor()`; `moduleCrumbs(db, moduleId)` → `notFound()`; `listItems(db, moduleId)`. Render `<Breadcrumbs crumbs={crumbs} />`, `PageHeader title={module title}`, `<ItemList moduleId={moduleId} items={items} />`.

- [ ] **Step 2:** `add-item-menu.tsx` (`"use client"`): a dropdown (`@radix-ui/react-dropdown-menu`, already a dep) with the 5 types (labels: "Обучающая информация", "Выбор ответа", "Заполнить пропуски", "Свободный ответ", "Сопоставление пар"). On pick: `await createItemAction(moduleId, defaultContentFor(type))` → toast + `router.refresh()`.

- [ ] **Step 3:** `item-list.tsx` (`"use client"`): map items; per item a card header with type label + ↑/↓ (`moveItemAction`) + delete (`deleteItemAction` with confirm); body dispatches on `item.type` to the matching editor component (Task 24-28), passing `item` and an `onSave(content)` that calls `updateItemAction(item.id, moduleId, content)`. Render `<AddItemMenu moduleId={moduleId} />` at the bottom.

- [ ] **Step 4: Verify + commit** (`npm run type-check && npm run lint`; `feat(materials): module editor shell`). Note: this task compiles only after Task 24-28 exist; if executing strictly in order, stub the editor components as `() => null` placeholders here and fill them in the next tasks, OR reorder so 24-28 come first. Recommended: implement 24-28 first, then wire in Step 3.

### Task 24: INFO item editor

**Files:** Create `app/(app)/materials/modules/[moduleId]/item-editors/info-editor.tsx`

**Interfaces:** `<InfoEditor content={InfoContent} onSave={(c: InfoContent)=>Promise<void>} />` — wraps `<RichTextEditor>`; a "Сохранить" button calls `onSave({ type: "INFO", doc })`.

- [ ] **Step 1:** Implement `"use client"`: local state `doc = content.doc`; `<RichTextEditor value={doc} onChange={setDoc} />`; `LoadingButton` "Сохранить" → `onSave`. Show `toast` handled by parent.
- [ ] **Step 2: Verify + commit** (`feat(materials): INFO editor`).

### Task 25: CHOICE item editor

**Files:** Create `.../item-editors/choice-editor.tsx`

**Interfaces:** `<ChoiceEditor content={ChoiceContent} onSave />` — question input; dynamic options list (add/remove); per-option "correct" checkbox; a "несколько правильных" switch; grading select (STRICT/PARTIAL, shown when multiple). Validates via `choiceContentSchema` before `onSave`.

- [ ] **Step 1:** Implement mirroring the quiz builder in `app/(app)/homework/homework-dialog.tsx` (options array with add/remove, correct markers). On save build `{ type:"CHOICE", question, options, correct, multiple, grading }`, run `itemContentSchema.safeParse`; on failure `toast.error` first issue; else `onSave`.
- [ ] **Step 2: Verify + commit** (`feat(materials): CHOICE editor`).

### Task 26: GAPS item editor

**Files:** Create `.../item-editors/gaps-editor.tsx`

**Interfaces:** `<GapsEditor content={GapsContent} onSave />` — a textarea for `text` (with helper text explaining `{{1}}` markers) and a blanks editor (per blank: `index` shown read-only from placeholder order, `answers` comma-separated, optional word-bank `options`). A "Обновить пропуски из текста" button that scans `{{n}}` and syncs the blanks list.

- [ ] **Step 1:** Implement: parse placeholders `/\{\{(\d+)\}\}/g` from text; keep a `blanks` state keyed by index; render inputs; build `{ type:"GAPS", text, blanks }`; validate with `itemContentSchema` before `onSave`.
- [ ] **Step 2: Verify + commit** (`feat(materials): GAPS editor`).

### Task 27: FREE item editor

**Files:** Create `.../item-editors/free-editor.tsx`

**Interfaces:** `<FreeEditor content={FreeContent} onSave />` — `prompt` textarea + optional `sampleAnswer` textarea.

- [ ] **Step 1:** Implement; build `{ type:"FREE", prompt, sampleAnswer: sampleAnswer.trim() || null }`; validate; `onSave`.
- [ ] **Step 2: Verify + commit** (`feat(materials): FREE editor`).

### Task 28: MATCH item editor + wire into item-list

**Files:**
- Create: `.../item-editors/match-editor.tsx`
- Modify: `.../item-list.tsx` (replace editor stubs with real dispatch)

**Interfaces:** `<MatchEditor content={MatchContent} onSave />` — optional `prompt` + dynamic pairs list (left/right inputs, add/remove).

- [ ] **Step 1:** Implement match editor; build `{ type:"MATCH", prompt: prompt.trim()||null, pairs }`; validate; `onSave`.
- [ ] **Step 2:** In `item-list.tsx`, replace any stubs with a `switch (item.type)` dispatch to `InfoEditor`/`ChoiceEditor`/`GapsEditor`/`FreeEditor`/`MatchEditor`, casting `item.content` to the matching content type (safe: `type` column matches).
- [ ] **Step 3: Verify + commit**

```bash
npm run type-check && npm run lint && npm test
git add app/\(app\)/materials
git commit -m "feat(materials): MATCH editor + wire item editors"
```

---

## Final verification

- [ ] `npm test` — all Vitest suites pass.
- [ ] `npm run type-check` — no errors.
- [ ] `npm run lint` — clean.
- [ ] Manual smoke (requires a Supabase project with the migration applied + `.env.local`): create a material → add section → lesson → module → add one item of each type → save each → reorder → reload and confirm persistence. Confirm `/files` still lists files and homework can still pick a file attachment.

---

## Self-review notes (author)

- **Spec coverage:** §1 model → Tasks 2-6; §2 files split → Tasks 7-9; §3 routing → Tasks 19-28; §4 layers → Tasks 11-18; §5 reorder → Tasks 10,20; §6 out-of-scope respected (no player/grading/assignment); §7 tests → Task 1 + TDD in Tasks 4,10. Item types INFO/CHOICE/GAPS/FREE/MATCH → Tasks 24-28.
- **No player/grading:** answer keys are stored (content schemas include `correct`/`answers`/`pairs`) but never executed — matches "authoring only".
- **Type consistency:** service/action/editor signatures use the same names (`ItemContent`, `defaultContentFor`, `swapForMove`, `moveXAction`) across tasks.
