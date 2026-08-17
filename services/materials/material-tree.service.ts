import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { MaterialItemType } from "@/types";

export interface TreeItem {
  id: string;
  title: string | null;
  type: MaterialItemType;
}
export interface TreeModule {
  id: string;
  title: string;
  items: TreeItem[];
}
export interface TreeLesson {
  id: string;
  title: string;
  modules: TreeModule[];
}
export interface TreeSection {
  id: string;
  title: string;
  lessons: TreeLesson[];
}

/** Full Section → Lesson → Module → Item hierarchy of a material, in order. */
export async function getMaterialTree(db: Db, materialId: string): Promise<TreeSection[]> {
  const { data: sections } = await db
    .from("material_sections")
    .select("id, title, position")
    .eq("material_id", materialId)
    .order("position", { ascending: true });
  const sectionRows = sections ?? [];
  if (sectionRows.length === 0) return [];

  const { data: lessons } = await db
    .from("material_lessons")
    .select("id, title, section_id, position")
    .in("section_id", sectionRows.map((s) => s.id))
    .order("position", { ascending: true });
  const lessonRows = lessons ?? [];

  const { data: modules } = lessonRows.length
    ? await db
        .from("material_modules")
        .select("id, title, lesson_id, position")
        .in("lesson_id", lessonRows.map((l) => l.id))
        .order("position", { ascending: true })
    : { data: [] };
  const moduleRows = modules ?? [];

  const { data: items } = moduleRows.length
    ? await db
        .from("material_items")
        .select("id, title, type, module_id, position")
        .in("module_id", moduleRows.map((m) => m.id))
        .order("position", { ascending: true })
    : { data: [] };
  const itemRows = items ?? [];

  const itemsByModule = new Map<string, TreeItem[]>();
  for (const it of itemRows) {
    const list = itemsByModule.get(it.module_id) ?? [];
    list.push({ id: it.id, title: it.title, type: it.type });
    itemsByModule.set(it.module_id, list);
  }

  const modulesByLesson = new Map<string, TreeModule[]>();
  for (const m of moduleRows) {
    const list = modulesByLesson.get(m.lesson_id) ?? [];
    list.push({ id: m.id, title: m.title, items: itemsByModule.get(m.id) ?? [] });
    modulesByLesson.set(m.lesson_id, list);
  }

  const lessonsBySection = new Map<string, TreeLesson[]>();
  for (const l of lessonRows) {
    const list = lessonsBySection.get(l.section_id) ?? [];
    list.push({ id: l.id, title: l.title, modules: modulesByLesson.get(l.id) ?? [] });
    lessonsBySection.set(l.section_id, list);
  }

  return sectionRows.map((s) => ({ id: s.id, title: s.title, lessons: lessonsBySection.get(s.id) ?? [] }));
}
