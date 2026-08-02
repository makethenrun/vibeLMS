import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { MaterialRow } from "@/types";

export async function getStudentGroupIds(db: Db, studentId: string): Promise<string[]> {
  const { data, error } = await db.from("group_members").select("group_id").eq("student_id", studentId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.group_id);
}

/** Materials accessible to a student via their groups. */
export async function listStudentMaterials(db: Db, studentId: string): Promise<MaterialRow[]> {
  const groupIds = await getStudentGroupIds(db, studentId);
  if (groupIds.length === 0) return [];

  const { data: mg, error: mgErr } = await db
    .from("material_groups")
    .select("material_id")
    .in("group_id", groupIds);
  if (mgErr) throw new Error(mgErr.message);
  const materialIds = [...new Set((mg ?? []).map((r) => r.material_id))];
  if (materialIds.length === 0) return [];

  const { data, error } = await db
    .from("materials")
    .select("*")
    .in("id", materialIds)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function studentHasMaterialAccess(db: Db, studentId: string, materialId: string): Promise<boolean> {
  const groupIds = await getStudentGroupIds(db, studentId);
  if (groupIds.length === 0) return false;
  const { data } = await db
    .from("material_groups")
    .select("group_id")
    .eq("material_id", materialId)
    .in("group_id", groupIds)
    .limit(1);
  return (data ?? []).length > 0;
}

/** The material id that owns a lesson (via its section), or null. */
export async function lessonMaterialId(db: Db, lessonId: string): Promise<string | null> {
  const { data: lesson } = await db
    .from("material_lessons")
    .select("section_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return null;
  const { data: section } = await db
    .from("material_sections")
    .select("material_id")
    .eq("id", lesson.section_id)
    .maybeSingle();
  return section?.material_id ?? null;
}

export async function studentHasItemAccess(db: Db, studentId: string, itemId: string): Promise<boolean> {
  const { data: item } = await db.from("material_items").select("module_id").eq("id", itemId).maybeSingle();
  if (!item) return false;
  const { data: mod } = await db.from("material_modules").select("lesson_id").eq("id", item.module_id).maybeSingle();
  if (!mod) return false;
  const materialId = await lessonMaterialId(db, mod.lesson_id);
  if (!materialId) return false;
  return studentHasMaterialAccess(db, studentId, materialId);
}
