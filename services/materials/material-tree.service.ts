import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { SectionWithLessons } from "@/types";

/**
 * Returns the material's sections (ordered) each with their ordered lessons.
 * Powers the navigation tree in the lesson/material workspace.
 */
export async function getMaterialTree(db: Db, materialId: string): Promise<SectionWithLessons[]> {
  const { data: sections, error: sErr } = await db
    .from("material_sections")
    .select("*")
    .eq("material_id", materialId)
    .order("position", { ascending: true });
  if (sErr) throw new Error(sErr.message);
  const sectionList = sections ?? [];
  if (sectionList.length === 0) return [];

  const { data: lessons, error: lErr } = await db
    .from("material_lessons")
    .select("*")
    .in(
      "section_id",
      sectionList.map((s) => s.id),
    )
    .order("position", { ascending: true });
  if (lErr) throw new Error(lErr.message);

  const bySection = new Map<string, typeof lessons>();
  for (const lesson of lessons ?? []) {
    const arr = bySection.get(lesson.section_id) ?? [];
    arr.push(lesson);
    bySection.set(lesson.section_id, arr);
  }

  return sectionList.map((section) => ({
    ...section,
    lessons: bySection.get(section.id) ?? [],
  }));
}
