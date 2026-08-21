"use server";

import { revalidatePath } from "next/cache";

import { getStaffOrNull, getStudentOrNull } from "@/lib/auth/guards";
import type { Db } from "@/lib/db/supabase";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { itemsForScope, type ScopeKind } from "@/lib/materials/scope";
import { canAccessGroup, canViewMaterial } from "@/services/assistants/assistants.service";
import type { ItemSubmissionRow } from "@/types";
import type { CurrentUser } from "@/lib/auth/current-user";
import * as live from "@/services/materials/live-session.service";
import { getMaterialTree } from "@/services/materials/material-tree.service";

function validDrawing(drawing: string | null): boolean {
  return drawing === null || (typeof drawing === "string" && drawing.startsWith("data:image/") && drawing.length <= 3_000_000);
}

/** Staff allowed to drive a session: the tutor, or an assistant for that group. */
async function sessionStaff(db: Db, sessionId: string): Promise<CurrentUser | null> {
  const user = await getStaffOrNull();
  if (!user) return null;
  if (user.role === "TUTOR") return user;
  const session = await live.getSession(db, sessionId);
  if (!session) return null;
  return (await canAccessGroup(db, user, session.group_id)) ? user : null;
}

export async function startSessionAction(materialId: string, groupId: string): Promise<ActionResult<{ sessionId: string }>> {
  const user = await getStaffOrNull();
  if (!user) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  if (user.role === "ASSISTANT" && !((await canAccessGroup(db, user, groupId)) && (await canViewMaterial(db, user, materialId)))) {
    return fail("Нет доступа к группе или материалу");
  }
  try {
    const session = await live.startSession(db, groupId, materialId, user.id);
    // Students should see a lesson right away.
    const tree = await getMaterialTree(db, materialId);
    const firstLesson = tree[0]?.lessons[0]?.id ?? null;
    if (firstLesson) await live.setActiveScope(db, session.id, "lesson", firstLesson);
    revalidatePath("/learn", "layout");
    return ok({ sessionId: session.id });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function setActiveScopeAction(sessionId: string, kind: ScopeKind, id: string | null): Promise<ActionResult> {
  const db = createServerSupabaseClient();
  if (!(await sessionStaff(db, sessionId))) return fail("Недостаточно прав");
  try {
    await live.setActiveScope(db, sessionId, kind, id);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function setFocusedItemAction(sessionId: string, itemId: string | null): Promise<ActionResult> {
  const db = createServerSupabaseClient();
  if (!(await sessionStaff(db, sessionId))) return fail("Недостаточно прав");
  try {
    await live.setFocusedItem(db, sessionId, itemId);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function saveTutorDrawingAction(sessionId: string, itemId: string, drawing: string | null): Promise<ActionResult> {
  if (!validDrawing(drawing)) return fail("Некорректный рисунок");
  const db = createServerSupabaseClient();
  if (!(await sessionStaff(db, sessionId))) return fail("Недостаточно прав");
  try {
    await live.upsertDrawing(db, sessionId, itemId, live.TUTOR_AUTHOR, null, drawing);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function saveStudentDrawingAction(sessionId: string, itemId: string, drawing: string | null): Promise<ActionResult> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");
  if (!validDrawing(drawing)) return fail("Некорректный рисунок");
  const db = createServerSupabaseClient();
  try {
    if (!(await live.studentInSession(db, student.studentId, sessionId))) return fail("Нет доступа");
    await live.upsertDrawing(db, sessionId, itemId, student.studentId, student.studentId, drawing);
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

export async function endSessionAction(sessionId: string): Promise<ActionResult> {
  const db = createServerSupabaseClient();
  if (!(await sessionStaff(db, sessionId))) return fail("Недостаточно прав");
  try {
    await live.endSession(db, sessionId);
    revalidatePath("/learn", "layout");
    return ok();
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

/** Tutor poll: state + scope items + results + tutor drawings (+ watched student's drawings). */
export async function pollSessionResultsAction(
  sessionId: string,
  watchStudentId?: string,
): Promise<ActionResult<{
  state: live.SessionState;
  itemIds: string[];
  results: live.SessionResultRow[];
  tutorDrawings: Record<string, string>;
  watchDrawings: Record<string, string>;
}>> {
  const db = createServerSupabaseClient();
  if (!(await sessionStaff(db, sessionId))) return fail("Недостаточно прав");
  try {
    const session = await live.getSession(db, sessionId);
    if (!session) return fail("Сессия не найдена");
    const state = live.toState(session);
    const tree = await getMaterialTree(db, session.material_id);
    const itemIds = itemsForScope(tree, state.kind, state.scopeId);
    const [results, tutorDrawings, watchDrawings] = await Promise.all([
      live.getSessionResults(db, session.group_id, itemIds),
      live.getDrawings(db, sessionId, itemIds, live.TUTOR_AUTHOR),
      watchStudentId ? live.getDrawings(db, sessionId, itemIds, watchStudentId) : Promise.resolve({}),
    ]);
    return ok({ state, itemIds, results, tutorDrawings, watchDrawings });
  } catch (e) {
    return fail(getErrorMessage(e));
  }
}

/** Student poll: state + scope items + own submissions + tutor drawings + own drawings. */
export async function pollStudentSessionAction(
  sessionId: string,
): Promise<ActionResult<{
  state: live.SessionState;
  itemIds: string[];
  submissions: Record<string, ItemSubmissionRow>;
  tutorDrawings: Record<string, string>;
  myDrawings: Record<string, string>;
}>> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");
  const db = createServerSupabaseClient();
  try {
    if (!(await live.studentInSession(db, student.studentId, sessionId))) return fail("Нет доступа");
    const session = await live.getSession(db, sessionId);
    if (!session) return fail("Сессия не найдена");
    // Mark the student present (only while the session is still running).
    if (!session.ended_at) await live.recordAttendance(db, sessionId, student.studentId);
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
    const [tutorDrawings, myDrawings] = await Promise.all([
      live.getDrawings(db, sessionId, itemIds, live.TUTOR_AUTHOR),
      live.getDrawings(db, sessionId, itemIds, student.studentId),
    ]);
    return ok({ state, itemIds, submissions, tutorDrawings, myDrawings });
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
