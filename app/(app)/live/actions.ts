"use server";

import { revalidatePath } from "next/cache";

import { getStudentOrNull, getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import type { ItemSubmissionRow } from "@/types";
import * as live from "@/services/materials/live-session.service";

export async function startSessionAction(materialId: string, groupId: string): Promise<ActionResult<{ sessionId: string }>> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    const session = await live.startSession(db, groupId, materialId);
    revalidatePath("/learn", "layout");
    return ok({ sessionId: session.id });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function setActiveItemAction(sessionId: string, itemId: string | null): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    await live.setActiveItem(db, sessionId, itemId);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function setSessionDrawingAction(sessionId: string, drawing: string | null): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  if (drawing !== null && (typeof drawing !== "string" || !drawing.startsWith("data:image/") || drawing.length > 3_000_000)) {
    return fail("Некорректный рисунок");
  }
  const db = createServerSupabaseClient();
  try {
    await live.setSessionDrawing(db, sessionId, drawing);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function endSessionAction(sessionId: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    await live.endSession(db, sessionId);
    revalidatePath("/learn", "layout");
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

/** Tutor poll: session state + per-student results for the active item. */
export async function pollSessionResultsAction(
  sessionId: string,
): Promise<ActionResult<{ state: live.SessionState; results: live.SessionResultRow[] }>> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    const session = await live.getSession(db, sessionId);
    if (!session) return fail("Сессия не найдена");
    const results = await live.getSessionResults(db, session);
    return ok({ state: live.toState(session), results });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

/** Student poll: session state + this student's submission for the active item. */
export async function pollStudentSessionAction(
  sessionId: string,
): Promise<ActionResult<{ state: live.SessionState; submission: ItemSubmissionRow | null }>> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    if (!(await live.studentInSession(db, student.studentId, sessionId))) return fail("Нет доступа");
    const session = await live.getSession(db, sessionId);
    if (!session) return fail("Сессия не найдена");
    let submission: ItemSubmissionRow | null = null;
    if (session.active_item_id) {
      const { data } = await db
        .from("material_item_submissions")
        .select("*")
        .eq("student_id", student.studentId)
        .eq("item_id", session.active_item_id)
        .maybeSingle();
      submission = data ?? null;
    }
    return ok({ state: live.toState(session), submission });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function activeSessionForStudentAction(): Promise<ActionResult<{ sessionId: string | null }>> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    const session = await live.getActiveSessionForStudent(db, student.studentId);
    return ok({ sessionId: session?.id ?? null });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}
