"use server";

import { revalidatePath } from "next/cache";

import { getManagerOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { grammarSchema, type GrammarInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { createGrammar, deleteGrammar, updateGrammar } from "@/services/grammar/grammar.service";

export async function createGrammarAction(input: GrammarInput): Promise<ActionResult> {
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");
  const parsed = grammarSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await createGrammar(db, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/grammar");
  return ok();
}

export async function updateGrammarAction(id: string, input: GrammarInput): Promise<ActionResult> {
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");
  const parsed = grammarSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await updateGrammar(db, id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/grammar");
  return ok();
}

export async function deleteGrammarAction(id: string): Promise<ActionResult> {
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    await deleteGrammar(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/grammar");
  return ok();
}
