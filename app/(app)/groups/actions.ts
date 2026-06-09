"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { groupMemberSchema, groupSchema, type GroupInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  removeGroupMember,
  updateGroup,
} from "@/services/groups/groups.service";

export async function createGroupAction(input: GroupInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await createGroup(db, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/groups");
  return ok();
}

export async function updateGroupAction(id: string, input: GroupInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await updateGroup(db, id, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${id}`);
  return ok();
}

export async function deleteGroupAction(id: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await deleteGroup(db, id);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/groups");
  return ok();
}

export async function addMemberAction(groupId: string, studentId: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = groupMemberSchema.safeParse({ studentId });
  if (!parsed.success) return fail("Выберите ученика");

  const db = createServerSupabaseClient();
  try {
    await addGroupMember(db, groupId, parsed.data.studentId);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath(`/groups/${groupId}`);
  return ok();
}

export async function removeMemberAction(
  groupId: string,
  studentId: string,
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await removeGroupMember(db, groupId, studentId);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath(`/groups/${groupId}`);
  return ok();
}
