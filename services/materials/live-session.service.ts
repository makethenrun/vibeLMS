import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ScopeKind } from "@/lib/materials/scope";
import type { ItemSubmissionRow, LiveSessionRow, Student } from "@/types";

export interface SessionState {
  kind: ScopeKind;
  scopeId: string | null; // active item id, or the section/lesson/module id
  focusedItemId: string | null; // exercise the tutor pinned (students scroll to it)
  endedAt: string | null;
  updatedAt: string;
}

export const TUTOR_AUTHOR = "tutor";

export interface SessionResultRow {
  studentId: string;
  fullName: string;
  submissions: Record<string, ItemSubmissionRow>; // item id → submission
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
/** A scheduled (not cancelled) lesson for the group near `now`, to link a session to. */
async function findScheduledLesson(db: Db, groupId: string): Promise<string | null> {
  const now = Date.now();
  const from = new Date(now - 4 * 3600 * 1000).toISOString(); // started up to 4h after
  const to = new Date(now + 2 * 3600 * 1000).toISOString(); // or up to 2h before
  const { data } = await db
    .from("lessons")
    .select("id, start_time")
    .eq("group_id", groupId)
    .neq("status", "CANCELLED")
    .gte("start_time", from)
    .lte("start_time", to)
    .order("start_time", { ascending: true });
  if (!data || data.length === 0) return null;
  // Closest scheduled lesson to now.
  let best = data[0];
  let bestDiff = Math.abs(new Date(best.start_time).getTime() - now);
  for (const l of data) {
    const diff = Math.abs(new Date(l.start_time).getTime() - now);
    if (diff < bestDiff) { best = l; bestDiff = diff; }
  }
  return best.id;
}

export async function startSession(db: Db, groupId: string, materialId: string, hostId: string): Promise<LiveSessionRow> {
  await db.from("live_sessions").update({ ended_at: new Date().toISOString() }).eq("group_id", groupId).is("ended_at", null);
  const lessonId = await findScheduledLesson(db, groupId);
  const { data, error } = await db
    .from("live_sessions")
    .insert({ group_id: groupId, material_id: materialId, host_id: hostId, lesson_id: lessonId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  // Reflect "conducted" on the calendar lesson too.
  if (lessonId) await db.from("lessons").update({ status: "COMPLETED" }).eq("id", lessonId).neq("status", "CANCELLED");
  return data;
}

/** Marks a student present in a session (first poll). No-op if already marked. */
export async function recordAttendance(db: Db, sessionId: string, studentId: string): Promise<void> {
  await db
    .from("live_session_attendance")
    .upsert({ session_id: sessionId, student_id: studentId }, { onConflict: "session_id,student_id", ignoreDuplicates: true });
}

export interface RaisedHand {
  studentId: string;
  fullName: string;
  raisedAt: string;
}

/** Raise (or refresh) a student's hand in a session. */
export async function raiseHand(db: Db, sessionId: string, studentId: string): Promise<void> {
  await db
    .from("live_session_hands")
    .upsert({ session_id: sessionId, student_id: studentId, raised_at: new Date().toISOString() }, { onConflict: "session_id,student_id" });
}

/** Lower one student's hand (student lowers it, or staff acknowledges it). */
export async function lowerHand(db: Db, sessionId: string, studentId: string): Promise<void> {
  await db.from("live_session_hands").delete().eq("session_id", sessionId).eq("student_id", studentId);
}

/** Clear every raised hand in a session. */
export async function clearHands(db: Db, sessionId: string): Promise<void> {
  await db.from("live_session_hands").delete().eq("session_id", sessionId);
}

export async function isHandRaised(db: Db, sessionId: string, studentId: string): Promise<boolean> {
  const { data } = await db
    .from("live_session_hands")
    .select("student_id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();
  return Boolean(data);
}

/** Raised hands with student names, oldest first. */
export async function getRaisedHands(db: Db, sessionId: string): Promise<RaisedHand[]> {
  const { data: rows } = await db
    .from("live_session_hands")
    .select("student_id, raised_at")
    .eq("session_id", sessionId)
    .order("raised_at", { ascending: true });
  const list = rows ?? [];
  if (list.length === 0) return [];
  const { data: students } = await db.from("students").select("id, full_name").in("id", list.map((r) => r.student_id));
  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name] as const));
  return list.map((r) => ({ studentId: r.student_id, fullName: nameById.get(r.student_id) ?? "Ученик", raisedAt: r.raised_at }));
}

export type SessionStatus = "conducted" | "not_conducted" | "cancelled" | "unplanned";

export interface SessionHistoryRow {
  id: string;
  title: string | null;
  groupName: string;
  hostLogin: string | null;
  startedAt: string;
  endedAt: string | null;
  status: SessionStatus;
  attended?: boolean;
  deleteSessionId?: string;
}

/** Deletes one session (cascades attendance/drawings). */
export async function deleteLiveSession(db: Db, sessionId: string): Promise<void> {
  const { error } = await db.from("live_sessions").delete().eq("id", sessionId);
  if (error) throw new Error(error.message);
}

interface SessRow { id: string; group_id: string; host_id: string | null; lesson_id: string | null; created_at: string; ended_at: string | null }

async function groupNameMap(db: Db, groupIds: string[]): Promise<Map<string, string>> {
  if (groupIds.length === 0) return new Map();
  const { data } = await db.from("groups").select("id, name").in("id", [...new Set(groupIds)]);
  return new Map((data ?? []).map((g) => [g.id, g.name] as const));
}

async function hostLoginMap(db: Db, hostIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(hostIds.filter((v): v is string => Boolean(v)))];
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const { data } = await db.from("users").select("id, login").in("id", ids);
  for (const h of data ?? []) map.set(h.id, h.login);
  return map;
}

export async function listSessionHistory(
  db: Db,
  viewer: { role: "TUTOR" | "ASSISTANT" | "STUDENT"; userId: string; studentId?: string; groupIds?: string[] },
): Promise<SessionHistoryRow[]> {
  // Assistant: only the sessions they hosted (planned → conducted, else unplanned).
  if (viewer.role === "ASSISTANT") {
    const { data } = await db
      .from("live_sessions")
      .select("id, group_id, host_id, lesson_id, created_at, ended_at")
      .eq("host_id", viewer.userId)
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(500);
    const rows = (data ?? []) as SessRow[];
    const names = await groupNameMap(db, rows.map((r) => r.group_id));
    return rows.map((r) => ({
      id: `s:${r.id}`,
      title: null,
      groupName: names.get(r.group_id) ?? "—",
      hostLogin: null,
      startedAt: r.created_at,
      endedAt: r.ended_at,
      status: (r.lesson_id ? "conducted" : "unplanned") as SessionStatus,
      deleteSessionId: r.id,
    }));
  }

  const now = new Date().toISOString();
  const groupFilter = viewer.role === "STUDENT" ? viewer.groupIds ?? [] : null;
  if (viewer.role === "STUDENT" && (!groupFilter || groupFilter.length === 0)) return [];

  // Past scheduled lessons.
  let lq = db
    .from("lessons")
    .select("id, title, group_id, start_time, end_time, status")
    .lt("start_time", now)
    .order("start_time", { ascending: false })
    .limit(500);
  if (groupFilter) lq = lq.in("group_id", groupFilter);
  const { data: lessons } = await lq;

  // Ended live sessions.
  let sq = db
    .from("live_sessions")
    .select("id, group_id, host_id, lesson_id, created_at, ended_at")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(500);
  if (groupFilter) sq = sq.in("group_id", groupFilter);
  const { data: sessData } = await sq;
  const sessions = (sessData ?? []) as SessRow[];

  const sessionByLesson = new Map<string, SessRow>();
  const unplanned: SessRow[] = [];
  for (const s of sessions) {
    if (s.lesson_id) { if (!sessionByLesson.has(s.lesson_id)) sessionByLesson.set(s.lesson_id, s); }
    else unplanned.push(s);
  }

  const names = await groupNameMap(db, [...(lessons ?? []).map((l) => l.group_id), ...sessions.map((s) => s.group_id)]);
  const hosts = await hostLoginMap(db, sessions.map((s) => s.host_id));

  let attended = new Set<string>();
  if (viewer.role === "STUDENT" && viewer.studentId && sessions.length > 0) {
    const { data: att } = await db
      .from("live_session_attendance")
      .select("session_id")
      .eq("student_id", viewer.studentId)
      .in("session_id", sessions.map((s) => s.id));
    attended = new Set((att ?? []).map((a) => a.session_id));
  }

  const rows: SessionHistoryRow[] = [];

  for (const l of lessons ?? []) {
    const sess = sessionByLesson.get(l.id);
    const status: SessionStatus = l.status === "CANCELLED" ? "cancelled" : l.status === "COMPLETED" || sess ? "conducted" : "not_conducted";
    rows.push({
      id: `l:${l.id}`,
      title: l.title,
      groupName: names.get(l.group_id) ?? "—",
      hostLogin: sess?.host_id ? hosts.get(sess.host_id) ?? "—" : null,
      startedAt: l.start_time,
      endedAt: l.end_time,
      status,
      attended: viewer.role === "STUDENT" ? (sess ? attended.has(sess.id) : false) : undefined,
    });
  }

  for (const s of unplanned) {
    rows.push({
      id: `s:${s.id}`,
      title: null,
      groupName: names.get(s.group_id) ?? "—",
      hostLogin: s.host_id ? hosts.get(s.host_id) ?? "—" : null,
      startedAt: s.created_at,
      endedAt: s.ended_at,
      status: "unplanned",
      attended: viewer.role === "STUDENT" ? attended.has(s.id) : undefined,
      deleteSessionId: viewer.role === "TUTOR" ? s.id : undefined,
    });
  }

  rows.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return rows;
}

export async function setActiveScope(db: Db, sessionId: string, kind: ScopeKind, id: string | null): Promise<void> {
  // Switching the active scope clears the live drawing.
  const { error } = await db
    .from("live_sessions")
    .update({
      active_kind: kind,
      active_item_id: kind === "item" ? id : null,
      active_node_id: kind === "item" ? null : id,
      focused_item_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function setFocusedItem(db: Db, sessionId: string, itemId: string | null): Promise<void> {
  const { error } = await db
    .from("live_sessions")
    .update({ focused_item_id: itemId, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

/** Upsert (or clear) one author's drawing for one exercise in a session. */
export async function upsertDrawing(
  db: Db,
  sessionId: string,
  itemId: string,
  authorKey: string,
  studentId: string | null,
  drawing: string | null,
): Promise<void> {
  if (drawing === null) {
    await db.from("live_drawings").delete().eq("session_id", sessionId).eq("item_id", itemId).eq("author_key", authorKey);
    return;
  }
  const { error } = await db
    .from("live_drawings")
    .upsert(
      { session_id: sessionId, item_id: itemId, author_key: authorKey, student_id: studentId, drawing, updated_at: new Date().toISOString() },
      { onConflict: "session_id,item_id,author_key" },
    );
  if (error) throw new Error(error.message);
}

/** Map item id → drawing for one author across the given items. */
export async function getDrawings(db: Db, sessionId: string, itemIds: string[], authorKey: string): Promise<Record<string, string>> {
  if (itemIds.length === 0) return {};
  const { data } = await db
    .from("live_drawings")
    .select("item_id, drawing")
    .eq("session_id", sessionId)
    .eq("author_key", authorKey)
    .in("item_id", itemIds);
  const map: Record<string, string> = {};
  for (const row of data ?? []) if (row.drawing) map[row.item_id] = row.drawing;
  return map;
}

export async function endSession(db: Db, sessionId: string): Promise<void> {
  const { error } = await db
    .from("live_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export function toState(session: LiveSessionRow): SessionState {
  const kind = (session.active_kind ?? "item") as ScopeKind;
  return {
    kind,
    scopeId: kind === "item" ? session.active_item_id : session.active_node_id,
    focusedItemId: session.focused_item_id,
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

/** Per-student submissions for the given items (the active scope). */
export async function getSessionResults(db: Db, groupId: string, itemIds: string[]): Promise<SessionResultRow[]> {
  const students = await getSessionStudents(db, groupId);
  if (itemIds.length === 0 || students.length === 0) {
    return students.map((s) => ({ studentId: s.id, fullName: s.full_name, submissions: {} }));
  }
  const { data: subs } = await db
    .from("material_item_submissions")
    .select("*")
    .in("item_id", itemIds)
    .in("student_id", students.map((s) => s.id));
  const byStudent = new Map<string, Record<string, ItemSubmissionRow>>();
  for (const row of subs ?? []) {
    const map = byStudent.get(row.student_id) ?? {};
    map[row.item_id] = row;
    byStudent.set(row.student_id, map);
  }
  return students.map((s) => ({ studentId: s.id, fullName: s.full_name, submissions: byStudent.get(s.id) ?? {} }));
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
