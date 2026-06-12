"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonSchema, type LessonInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import type { LessonStatus } from "@/lib/db/database.types";
import {
  createLesson,
  deleteLesson,
  getLessonRoster,
  setLessonAttendance,
  setLessonStatus,
  updateLesson,
} from "@/services/lessons/lessons.service";
import type { AttendanceRosterItem } from "@/types";

const STATUSES: LessonStatus[] = ["SCHEDULED", "COMPLETED", "CANCELLED"];

export async function createLessonAction(input: LessonInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await createLesson(db, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  return ok();
}

export async function updateLessonAction(id: string, input: LessonInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await updateLesson(db, id, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  return ok();
}

export async function setLessonStatusAction(
  id: string,
  status: LessonStatus,
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  if (!STATUSES.includes(status)) return fail("Некорректный статус");

  const db = createServerSupabaseClient();
  try {
    await setLessonStatus(db, id, status);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  return ok();
}

export async function deleteLessonAction(id: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await deleteLesson(db, id);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  return ok();
}

export async function loadAttendanceAction(
  lessonId: string,
): Promise<ActionResult<AttendanceRosterItem[]>> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    const roster = await getLessonRoster(db, lessonId);
    return ok(roster);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

export async function saveAttendanceAction(
  lessonId: string,
  presentStudentIds: string[],
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await setLessonAttendance(db, lessonId, presentStudentIds);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/lessons");
  return ok();
}
