"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { dictionaryEntrySchema, type DictionaryEntryInput } from "@/lib/validators";
import type { DictionaryEntry } from "@/types";
import { createEntry, deleteEntry, listDictionary, updateEntry } from "@/services/dictionary/dictionary.service";

export async function createEntryAction(input: DictionaryEntryInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const parsed = dictionaryEntrySchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await createEntry(db, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/dictionary");
  return ok();
}

export async function updateEntryAction(id: string, input: DictionaryEntryInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const parsed = dictionaryEntrySchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await updateEntry(db, id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/dictionary");
  return ok();
}

export async function deleteEntryAction(id: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    await deleteEntry(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/dictionary");
  return ok();
}

/** Read the whole dictionary (any authenticated user) — used by the lookup popup. */
export async function listDictionaryAction(): Promise<DictionaryEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = createServerSupabaseClient();
  return listDictionary(db);
}
