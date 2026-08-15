import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ItemSubmissionRow, LiveSessionRow, Student } from "@/types";

export interface SessionState {
  activeItemId: string | null;
  drawing: string | null;
  endedAt: string | null;
  updatedAt: string;
}

export interface SessionResultRow {
  studentId: string;
  fullName: string;
  submission: ItemSubmissionRow | null;
}

export async function getSession(db: Db, sessionId: string): Promise<LiveSessionRow | null> {
  const { data } = await db.from("live_sessions").select("*").eq("id", sessionId).maybeSingle();
  return data ?? null;
}

/** The active (not ended) session for a group, if any. */
export async function getActiveSession(db: Db, groupId: string): Promise<LiveSessionRow | null> {
  const { data } = await db
    .from("live_sessions")
    .select("*")
    .eq("group_id", groupId)
    .is("ended_at", null)
    .maybeSingle();
  return data ?? null;
}

/** Ends any active session for the group, then starts a fresh one. */
export async function startSession(db: Db, groupId: string, materialId: string): Promise<LiveSessionRow> {
  await db.from("live_sessions").update({ ended_at: new Date().toISOString() }).eq("group_id", groupId).is("ended_at", null);
  const { data, error } = await db
    .from("live_sessions")
    .insert({ group_id: groupId, material_id: materialId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setActiveItem(db: Db, sessionId: string, itemId: string | null): Promise<void> {
  // Switching the exercise clears the live drawing.
  const { error } = await db
    .from("live_sessions")
    .update({ active_item_id: itemId, drawing: null, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function setSessionDrawing(db: Db, sessionId: string, drawing: string | null): Promise<void> {
  const { error } = await db
    .from("live_sessions")
    .update({ drawing, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function endSession(db: Db, sessionId: string): Promise<void> {
  const { error } = await db
    .from("live_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export function toState(session: LiveSessionRow): SessionState {
  return {
    activeItemId: session.active_item_id,
    drawing: session.drawing,
    endedAt: session.ended_at,
    updatedAt: session.updated_at,
  };
}

/** Students in the session's group. */
export async function getSessionStudents(db: Db, groupId: string): Promise<Student[]> {
  const { data: links } = await db.from("group_members").select("student_id").eq("group_id", groupId);
  const ids = (links ?? []).map((l) => l.student_id);
  if (ids.length === 0) return [];
  const { data } = await db.from("students").select("*").in("id", ids).order("full_name", { ascending: true });
  return data ?? [];
}

/** True if the student belongs to the session's group (access check). */
export async function studentInSession(db: Db, studentId: string, sessionId: string): Promise<boolean> {
  const session = await getSession(db, sessionId);
  if (!session) return false;
  const { data } = await db
    .from("group_members")
    .select("student_id")
    .eq("group_id", session.group_id)
    .eq("student_id", studentId)
    .maybeSingle();
  return Boolean(data);
}

/** Per-student result for the session's active item. */
export async function getSessionResults(db: Db, session: LiveSessionRow): Promise<SessionResultRow[]> {
  const students = await getSessionStudents(db, session.group_id);
  if (!session.active_item_id || students.length === 0) {
    return students.map((s) => ({ studentId: s.id, fullName: s.full_name, submission: null }));
  }
  const { data: subs } = await db
    .from("material_item_submissions")
    .select("*")
    .eq("item_id", session.active_item_id)
    .in("student_id", students.map((s) => s.id));
  const byStudent = new Map((subs ?? []).map((r) => [r.student_id, r] as const));
  return students.map((s) => ({ studentId: s.id, fullName: s.full_name, submission: byStudent.get(s.id) ?? null }));
}

/** The active session (if any) among the groups the student belongs to. */
export async function getActiveSessionForStudent(db: Db, studentId: string): Promise<LiveSessionRow | null> {
  const { data: links } = await db.from("group_members").select("group_id").eq("student_id", studentId);
  const groupIds = (links ?? []).map((l) => l.group_id);
  if (groupIds.length === 0) return null;
  const { data } = await db
    .from("live_sessions")
    .select("*")
    .in("group_id", groupIds)
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
