import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ItemRow, MaterialItemType, Student } from "@/types";

/** Item types that produce a score (auto or manual). */
export const GRADABLE_TYPES: MaterialItemType[] = ["QUIZ", "GAPS", "IMAGE_TASK", "SENTENCE_TASK", "MATCH", "FREE"];

export interface MaterialItemFlat {
  item: ItemRow;
  lessonTitle: string;
  moduleTitle: string;
}

/** All items of a material, in order, with their lesson/module titles. */
export async function getMaterialItemsFlat(db: Db, materialId: string): Promise<MaterialItemFlat[]> {
  const { data: sections } = await db
    .from("material_sections")
    .select("id, position")
    .eq("material_id", materialId)
    .order("position", { ascending: true });
  const sectionIds = (sections ?? []).map((s) => s.id);
  if (sectionIds.length === 0) return [];

  const { data: lessons } = await db
    .from("material_lessons")
    .select("id, title, section_id, position")
    .in("section_id", sectionIds)
    .order("position", { ascending: true });
  const lessonIds = (lessons ?? []).map((l) => l.id);
  if (lessonIds.length === 0) return [];
  const lessonTitle = new Map((lessons ?? []).map((l) => [l.id, l.title] as const));

  const { data: modules } = await db
    .from("material_modules")
    .select("id, title, lesson_id, position")
    .in("lesson_id", lessonIds)
    .order("position", { ascending: true });
  const moduleIds = (modules ?? []).map((m) => m.id);
  if (moduleIds.length === 0) return [];
  const moduleInfo = new Map((modules ?? []).map((m) => [m.id, { title: m.title, lessonId: m.lesson_id }] as const));

  const { data: items } = await db
    .from("material_items")
    .select("*")
    .in("module_id", moduleIds)
    .order("position", { ascending: true });

  return (items ?? []).map((item) => {
    const mod = moduleInfo.get(item.module_id);
    return {
      item,
      moduleTitle: mod?.title ?? "—",
      lessonTitle: mod ? lessonTitle.get(mod.lessonId) ?? "—" : "—",
    };
  });
}

/** Students who can access a material (via its groups). */
export async function listMaterialStudents(db: Db, materialId: string): Promise<Student[]> {
  const { data: mg } = await db.from("material_groups").select("group_id").eq("material_id", materialId);
  const groupIds = (mg ?? []).map((r) => r.group_id);
  if (groupIds.length === 0) return [];

  const { data: gm } = await db.from("group_members").select("student_id").in("group_id", groupIds);
  const studentIds = [...new Set((gm ?? []).map((r) => r.student_id))];
  if (studentIds.length === 0) return [];

  const { data } = await db.from("students").select("*").in("id", studentIds).order("full_name");
  return data ?? [];
}
