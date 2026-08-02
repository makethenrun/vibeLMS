import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ItemSubmissionRow, Json } from "@/types";

export async function upsertSubmission(
  db: Db,
  studentId: string,
  itemId: string,
  answer: Json,
  score: number | null,
): Promise<void> {
  const { error } = await db
    .from("material_item_submissions")
    .upsert(
      { student_id: studentId, item_id: itemId, answer, score, submitted_at: new Date().toISOString() },
      { onConflict: "student_id,item_id" },
    );
  if (error) throw new Error(error.message);
}

/** Map of item id → the student's submission, for a set of items. */
export async function getSubmissionsForItems(
  db: Db,
  studentId: string,
  itemIds: string[],
): Promise<Record<string, ItemSubmissionRow>> {
  if (itemIds.length === 0) return {};
  const { data, error } = await db
    .from("material_item_submissions")
    .select("*")
    .eq("student_id", studentId)
    .in("item_id", itemIds);
  if (error) throw new Error(error.message);
  const map: Record<string, ItemSubmissionRow> = {};
  for (const row of data ?? []) map[row.item_id] = row;
  return map;
}
