"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import {
  assistantSchema,
  assistantProfileSchema,
  credentialsSchema,
  type AssistantInput,
  type AssistantProfileInput,
  type CredentialsInput,
} from "@/lib/validators";
import * as assistants from "@/services/assistants/assistants.service";

async function requireTutor(): Promise<ActionResult | null> {
  const tutor = await getTutorOrNull();
  return tutor ? null : fail("Недостаточно прав");
}

export async function createAssistantAction(input: AssistantInput): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const parsed = assistantSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await assistants.createAssistant(db, { ...parsed.data, login: parsed.data.login.toLowerCase() });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/assistants");
  return ok();
}

export async function updateAssistantAction(id: string, input: AssistantProfileInput): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const parsed = assistantProfileSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await assistants.updateAssistantProfile(db, id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/assistants");
  return ok();
}

export async function issueAssistantCredentialsAction(id: string, input: CredentialsInput): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  const login = parsed.data.login.toLowerCase();
  if (await assistants.loginTakenByOther(db, login, id)) {
    return fail("Такой логин уже занят", { login: ["Такой логин уже занят"] });
  }
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await assistants.updateAssistantCredentials(db, id, { login, passwordHash });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/assistants");
  return ok();
}

export async function archiveAssistantAction(id: string, archived: boolean): Promise<ActionResult> {
  const denied = await requireTutor();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await assistants.setAssistantArchived(db, id, archived);
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
