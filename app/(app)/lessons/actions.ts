"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { lessonSchema, type LessonInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import type { LessonStatus } from "@/lib/db/database.types";
import {
  createLesson,
  createLessonsBulk,
  deleteLesson,
  getLessonRoster,
  setLessonAttendance,
  setLessonStatus,
  updateLesson,
  type BulkLessonRow,
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

export async function createRecurringLessonsAction(
  groupId: string,
  meetingUrl: string | undefined,
  rows: BulkLessonRow[],
): Promise<ActionResult<{ count: number }>> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  if (!/^[0-9a-f-]{36}$/i.test(groupId)) return fail("Выберите группу");
  if (!Array.isArray(rows) || rows.length === 0) return fail("Нет занятий для создания — проверьте период и дни");
  if (rows.length > 400) return fail("Слишком много занятий (максимум 400)");
  for (const r of rows) {
    if (!r.title || r.title.trim().length < 2) return fail("Название: минимум 2 символа");
    if (Number.isNaN(Date.parse(r.startTime)) || Number.isNaN(Date.parse(r.endTime))) return fail("Некорректные даты");
    if (Date.parse(r.endTime) <= Date.parse(r.startTime)) return fail("Окончание должно быть позже начала");
  }

  const db = createServerSupabaseClient();
  try {
    const count = await createLessonsBulk(db, groupId, meetingUrl, rows);
    revalidatePath("/lessons");
    revalidatePath("/dashboard");
    return ok({ count });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
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
