import "server-only";

import type { Db } from "@/lib/db/supabase";
import { getSectionsWithLessons } from "./sections-tree.service";

export interface FlatModule {
  lessonId: string;
  moduleId: string;
  title: string;
}

/**
 * Every module of a material in reading order (section → lesson → module).
 * Powers cross-lesson prev/next module navigation: the module before the first
 * in a lesson is the last module of the previous lesson, and vice versa.
 */
export async function getMaterialModulesFlat(db: Db, materialId: string): Promise<FlatModule[]> {
  const sections = await getSectionsWithLessons(db, materialId);
  const lessonIds = sections.flatMap((s) => s.lessons.map((l) => l.id));
  if (lessonIds.length === 0) return [];

  const { data: modules } = await db
    .from("material_modules")
    .select("id, lesson_id, title, position")
    .in("lesson_id", lessonIds)
    .order("position", { ascending: true });

  const byLesson = new Map<string, { id: string; title: string }[]>();
  for (const m of modules ?? []) {
    const arr = byLesson.get(m.lesson_id) ?? [];
    arr.push({ id: m.id, title: m.title });
    byLesson.set(m.lesson_id, arr);
  }

  return lessonIds.flatMap((lid) =>
    (byLesson.get(lid) ?? []).map((m) => ({ lessonId: lid, moduleId: m.id, title: m.title })),
  );
}
