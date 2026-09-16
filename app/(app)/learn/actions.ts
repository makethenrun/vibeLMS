"use server";

import { revalidatePath } from "next/cache";

import { getStudentOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { checkItem } from "@/lib/materials/scoring";
import type { ItemContent } from "@/lib/validators";
import type { Json } from "@/types";
import { itemMaterialLanguage, studentHasItemAccess } from "@/services/materials/student-access.service";
import { upsertSubmission } from "@/services/materials/submissions.service";
import { importVocabToDictionary } from "@/services/dictionary/dictionary.service";

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
    .select("content, vocab")
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

  // Completing an exercise imports its "new words" into the student's own
  // dictionary (best-effort — never blocks the submission).
  if (Array.isArray(item.vocab) && item.vocab.length > 0) {
    try {
      const language = await itemMaterialLanguage(db, itemId);
      await importVocabToDictionary(
        db,
        student.user.id,
        item.vocab as { term?: string; pinyin?: string; translation?: string }[],
        language,
      );
      revalidatePath("/dictionary");
    } catch {
      // ignore — the submission already succeeded
    }
  }

  revalidatePath("/learn", "layout");
  return ok({ score });
}

/** Manually imports an item's "new words" into the student's dictionary (used
 *  for exercises that have no submit, e.g. INFO/audio/image/link). */
export async function importItemVocabAction(itemId: string): Promise<ActionResult<{ count: number }>> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  const allowed = await studentHasItemAccess(db, student.studentId, itemId);
  if (!allowed) return fail("Нет доступа к упражнению");

  const { data: item, error } = await db.from("material_items").select("vocab").eq("id", itemId).maybeSingle();
  if (error) return fail(error.message);
  const vocab = Array.isArray(item?.vocab)
    ? (item.vocab as { term?: string; pinyin?: string; translation?: string }[])
    : [];
  if (vocab.length === 0) return ok({ count: 0 });

  try {
    const language = await itemMaterialLanguage(db, itemId);
    const count = await importVocabToDictionary(db, student.user.id, vocab, language);
    revalidatePath("/dictionary");
    return ok({ count });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}
