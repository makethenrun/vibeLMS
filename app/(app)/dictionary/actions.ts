"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { dictionaryEntrySchema, type DictionaryEntryInput } from "@/lib/validators";
import type { DictionaryEntry } from "@/types";
import { createEntry, deleteEntry, listDictionary, updateEntry } from "@/services/dictionary/dictionary.service";

export async function createEntryAction(input: DictionaryEntryInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Не авторизовано");
  const parsed = dictionaryEntrySchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await createEntry(db, user.id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/dictionary");
  return ok();
}

export async function updateEntryAction(id: string, input: DictionaryEntryInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Не авторизовано");
  const parsed = dictionaryEntrySchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await updateEntry(db, user.id, id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/dictionary");
  return ok();
}

export async function deleteEntryAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Не авторизовано");
  const db = createServerSupabaseClient();
  try {
    await deleteEntry(db, user.id, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/dictionary");
  return ok();
}

/** Read the current user's dictionary — used by the lookup popup. */
export async function listDictionaryAction(): Promise<DictionaryEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = createServerSupabaseClient();
  return listDictionary(db, user.id);
}
