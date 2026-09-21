"use server";

import { revalidatePath } from "next/cache";

import { getManagerOrNull, getTutorOrNull } from "@/lib/auth/guards";
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
import { addGroupToMaterial } from "@/services/materials/material-groups.service";
import { setLessonAccess } from "@/services/materials/lesson-access.service";
import type { LessonAccessMode } from "@/types";

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
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");

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
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await removeGroupMember(db, groupId, studentId);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath(`/groups/${groupId}`);
  return ok();
}

/** Grants a group access to a material from the group page. */
export async function addMaterialToGroupAction(groupId: string, materialId: string): Promise<ActionResult> {
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");
  if (!groupId || !materialId) return fail("Выберите материал");

  const db = createServerSupabaseClient();
  try {
    await addGroupToMaterial(db, materialId, groupId);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/materials/${materialId}`);
  return ok();
}

const ACCESS_MODES: LessonAccessMode[] = ["OPEN", "DATE", "PROGRESS", "MANUAL"];

/** Sets a group's access rule for a single lesson. */
export async function setLessonAccessAction(
  groupId: string,
  lessonId: string,
  input: { mode: LessonAccessMode; availableAt?: string | null; unlocked?: boolean },
): Promise<ActionResult> {
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");
  if (!groupId || !lessonId) return fail("Некорректный запрос");
  if (!ACCESS_MODES.includes(input.mode)) return fail("Неизвестный режим доступа");
  if (input.mode === "DATE" && !input.availableAt) return fail("Укажите дату и время открытия");

  const db = createServerSupabaseClient();
  try {
    await setLessonAccess(db, groupId, lessonId, {
      mode: input.mode,
      availableAt: input.availableAt ?? null,
      unlocked: input.unlocked ?? false,
    });
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath(`/groups/${groupId}`);
  return ok();
}
