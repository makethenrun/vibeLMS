"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import * as assistants from "@/services/assistants/assistants.service";

async function requireTutor(): Promise<ActionResult | null> {
  const tutor = await getTutorOrNull();
  return tutor ? null : fail("Недостаточно прав");
}

export async function createAssistantAction(login: string, password: string): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const l = login.trim().toLowerCase();
  if (l.length < 3) return fail("Логин: минимум 3 символа");
  if (password.length < 4) return fail("Пароль: минимум 4 символа");
  const db = createServerSupabaseClient();
  try {
    await assistants.createAssistant(db, l, password);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/assistants");
  return ok();
}

export async function deleteAssistantAction(id: string): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await assistants.deleteAssistant(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/assistants");
  return ok();
}

export async function setAssistantGroupsAction(id: string, groupIds: string[]): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await assistants.setAssistantGroups(db, id, groupIds);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/assistants");
  return ok();
}

export async function setAssistantMaterialsAction(
  id: string,
  entries: { materialId: string; canEdit: boolean }[],
): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await assistants.setAssistantMaterials(db, id, entries);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/assistants");
  revalidatePath("/materials", "layout");
  return ok();
}
