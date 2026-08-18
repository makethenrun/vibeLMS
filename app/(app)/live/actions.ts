"use server";

import { revalidatePath } from "next/cache";

import { getStudentOrNull, getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { itemsForScope, type ScopeKind } from "@/lib/materials/scope";
import type { ItemSubmissionRow } from "@/types";
import * as live from "@/services/materials/live-session.service";
import { getMaterialTree } from "@/services/materials/material-tree.service";

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

export async function setActiveScopeAction(sessionId: string, kind: ScopeKind, id: string | null): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    await live.setActiveScope(db, sessionId, kind, id);
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

/** Tutor poll: session state + item ids of the active scope + per-student results. */
export async function pollSessionResultsAction(
  sessionId: string,
): Promise<ActionResult<{ state: live.SessionState; itemIds: string[]; results: live.SessionResultRow[] }>> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    const session = await live.getSession(db, sessionId);
    if (!session) return fail("Сессия не найдена");
    const state = live.toState(session);
    const tree = await getMaterialTree(db, session.material_id);
    const itemIds = itemsForScope(tree, state.kind, state.scopeId);
    const results = await live.getSessionResults(db, session.group_id, itemIds);
    return ok({ state, itemIds, results });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

/** Student poll: session state + active scope items + this student's submissions. */
export async function pollStudentSessionAction(
  sessionId: string,
): Promise<ActionResult<{ state: live.SessionState; itemIds: string[]; submissions: Record<string, ItemSubmissionRow> }>> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    if (!(await live.studentInSession(db, student.studentId, sessionId))) return fail("Нет доступа");
    const session = await live.getSession(db, sessionId);
    if (!session) return fail("Сессия не найдена");
    const state = live.toState(session);
    const tree = await getMaterialTree(db, session.material_id);
    const itemIds = itemsForScope(tree, state.kind, state.scopeId);
    const submissions: Record<string, ItemSubmissionRow> = {};
    if (itemIds.length > 0) {
      const { data } = await db
        .from("material_item_submissions")
        .select("*")
        .eq("student_id", student.studentId)
        .in("item_id", itemIds);
      for (const row of data ?? []) submissions[row.item_id] = row;
    }
    return ok({ state, itemIds, submissions });
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
