import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { SectionWithLessons } from "@/types";
import { listSections } from "./sections.service";

/**
 * Returns the material's sections (ordered), each with their ordered lessons —
 * powers the sections navigation tree on the material page.
 */
export async function getSectionsWithLessons(db: Db, materialId: string): Promise<SectionWithLessons[]> {
  const sections = await listSections(db, materialId);
  if (sections.length === 0) return [];

  const { data: lessons, error } = await db
    .from("material_lessons")
    .select("*")
    .in(
      "section_id",
      sections.map((s) => s.id),
    )
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  const bySection = new Map<string, typeof lessons>();
  for (const lesson of lessons ?? []) {
    const arr = bySection.get(lesson.section_id) ?? [];
    arr.push(lesson);
    bySection.set(lesson.section_id, arr);
  }

  return sections.map((section) => ({ ...section, lessons: bySection.get(section.id) ?? [] }));
}
