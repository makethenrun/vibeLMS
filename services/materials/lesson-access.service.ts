import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { CardsContent } from "@/lib/validators";
import type { ItemRow, LessonAccessMode, LessonAccessRow } from "@/types";
import { getStudentGroupIds } from "./student-access.service";
import { getSectionsWithLessons } from "./sections-tree.service";
import { GRADABLE_TYPES, getMaterialItemsFlat } from "./results.service";
import { getSubmissionsForItems } from "./submissions.service";

export interface LessonAccessInput {
  mode: LessonAccessMode;
  availableAt?: string | null;
  unlocked?: boolean;
}

/** Whether an item requires a submission from the student (counts for progress). */
function isSubmittable(item: ItemRow): boolean {
  if (!GRADABLE_TYPES.includes(item.type)) return false;
  if (item.type === "CARDS") return (item.content as unknown as CardsContent).mode === "ANSWER";
  return true;
}

/** Access rules a group has set, keyed by lesson id. */
export async function getGroupLessonAccess(db: Db, groupId: string): Promise<Map<string, LessonAccessRow>> {
  const { data, error } = await db.from("lesson_access").select("*").eq("group_id", groupId);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((r) => [r.lesson_id, r] as const));
}

/** Upsert a group's access rule for a lesson. */
export async function setLessonAccess(
  db: Db,
  groupId: string,
  lessonId: string,
  input: LessonAccessInput,
): Promise<void> {
  const { error } = await db
    .from("lesson_access")
    .upsert(
      {
        group_id: groupId,
        lesson_id: lessonId,
        mode: input.mode,
        available_at: input.mode === "DATE" ? input.availableAt ?? null : null,
        unlocked: input.mode === "MANUAL" ? Boolean(input.unlocked) : false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id,lesson_id" },
    );
  if (error) throw new Error(error.message);
}

/**
 * The set of lessons in a material a student may currently open. A student who
 * belongs to several groups that all have the material can open a lesson if ANY
 * of those groups grants access. Absence of a rule means OPEN.
 */
export async function computeAccessibleLessons(
  db: Db,
  studentId: string,
  materialId: string,
): Promise<Set<string>> {
  // Ordered lessons of the material (including empty ones).
  const sections = await getSectionsWithLessons(db, materialId);
  const orderedLessonIds: string[] = [];
  for (const s of sections) for (const l of s.lessons) orderedLessonIds.push(l.id);
  if (orderedLessonIds.length === 0) return new Set();

  // Groups the student is in that actually have this material.
  const studentGroupIds = await getStudentGroupIds(db, studentId);
  let materialGroupIds: string[] = [];
  if (studentGroupIds.length > 0) {
    const { data: mg } = await db
      .from("material_groups")
      .select("group_id")
      .eq("material_id", materialId)
      .in("group_id", studentGroupIds);
    materialGroupIds = [...new Set((mg ?? []).map((r) => r.group_id))];
  }
  // No group grants the material — nothing accessible.
  if (materialGroupIds.length === 0) return new Set();

  // Access rules for those groups.
  const { data: rules } = await db
    .from("lesson_access")
    .select("*")
    .in("group_id", materialGroupIds)
    .in("lesson_id", orderedLessonIds);
  const ruleByKey = new Map((rules ?? []).map((r) => [`${r.group_id}:${r.lesson_id}`, r] as const));

  // Submittable items per lesson + which the student has submitted (for PROGRESS).
  const flat = await getMaterialItemsFlat(db, materialId);
  const submittableByLesson = new Map<string, string[]>();
  for (const f of flat) {
    if (!isSubmittable(f.item)) continue;
    const list = submittableByLesson.get(f.lessonId) ?? [];
    list.push(f.item.id);
    submittableByLesson.set(f.lessonId, list);
  }
  const allSubmittableIds = [...submittableByLesson.values()].flat();
  const submissions = allSubmittableIds.length
    ? await getSubmissionsForItems(db, studentId, allSubmittableIds)
    : {};

  const lessonCompleted = (lessonId: string): boolean => {
    const ids = submittableByLesson.get(lessonId) ?? [];
    return ids.every((id) => submissions[id]);
  };

  const now = Date.now();
  const grants = (rule: LessonAccessRow | undefined, index: number): boolean => {
    if (!rule || rule.mode === "OPEN") return true;
    if (rule.mode === "MANUAL") return rule.unlocked;
    if (rule.mode === "DATE") return Boolean(rule.available_at) && now >= new Date(rule.available_at!).getTime();
    if (rule.mode === "PROGRESS") {
      if (index === 0) return true; // first lesson has no predecessor
      return lessonCompleted(orderedLessonIds[index - 1]);
    }
    return true;
  };

  const accessible = new Set<string>();
  orderedLessonIds.forEach((lessonId, index) => {
    const ok = materialGroupIds.some((g) => grants(ruleByKey.get(`${g}:${lessonId}`), index));
    if (ok) accessible.add(lessonId);
  });
  return accessible;
}

/** Whether a single lesson is currently accessible to a student. */
export async function studentHasLessonAccess(db: Db, studentId: string, lessonId: string, materialId: string): Promise<boolean> {
  const accessible = await computeAccessibleLessons(db, studentId, materialId);
  return accessible.has(lessonId);
}
