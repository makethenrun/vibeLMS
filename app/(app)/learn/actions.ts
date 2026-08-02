"use server";

import { revalidatePath } from "next/cache";

import { getStudentOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { checkItem } from "@/lib/materials/scoring";
import type { ItemContent } from "@/lib/validators";
import type { Json } from "@/types";
import { studentHasItemAccess } from "@/services/materials/student-access.service";
import { upsertSubmission } from "@/services/materials/submissions.service";

export async function submitItemAction(
  itemId: string,
  answer: Json,
): Promise<ActionResult<{ score: number | null }>> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();

  const allowed = await studentHasItemAccess(db, student.studentId, itemId);
  if (!allowed) return fail("Нет доступа к упражнению");

  const { data: item, error } = await db
    .from("material_items")
    .select("content")
    .eq("id", itemId)
    .maybeSingle();
  if (error) return fail(error.message);
  if (!item) return fail("Упражнение не найдено");

  const score = checkItem(item.content as unknown as ItemContent, answer);

  try {
    await upsertSubmission(db, student.studentId, itemId, answer, score);
  } catch (e) {
    return fail(getErrorMessage(e));
  }

  revalidatePath("/learn", "layout");
  return ok({ score });
}
