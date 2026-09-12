import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { LessonInput } from "@/lib/validators";
import type { AttendanceRosterItem, Lesson, LessonStatus, LessonWithGroup } from "@/types";

function toIso(value: string): string {
  return new Date(value).toISOString();
}

function normalizeMeetingUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return trimmed === "" ? null : trimmed;
}

async function attachGroupNames(db: Db, lessons: Lesson[]): Promise<LessonWithGroup[]> {
  if (lessons.length === 0) return [];
  const groupIds = [...new Set(lessons.map((lesson) => lesson.group_id))];
  const { data: groups } = await db.from("groups").select("id, name").in("id", groupIds);
  const nameById = new Map((groups ?? []).map((group) => [group.id, group.name] as const));
  return lessons.map((lesson) => ({
    ...lesson,
    groupName: nameById.get(lesson.group_id) ?? "—",
  }));
}

export interface ListLessonsBetweenParams {
  from: string;
  to: string;
  groupIds?: string[];
}

export async function listLessonsBetween(
  db: Db,
  params: ListLessonsBetweenParams,
): Promise<LessonWithGroup[]> {
  if (params.groupIds && params.groupIds.length === 0) return [];

  let query = db
    .from("lessons")
    .select("*")
    .gte("start_time", params.from)
    .lte("start_time", params.to)
    .order("start_time", { ascending: true });

  if (params.groupIds) query = query.in("group_id", params.groupIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachGroupNames(db, data ?? []);
}

export async function listUpcomingLessons(
  db: Db,
  options: { groupIds?: string[]; limit?: number } = {},
): Promise<LessonWithGroup[]> {
  if (options.groupIds && options.groupIds.length === 0) return [];

  let query = db
    .from("lessons")
    .select("*")
    .eq("status", "SCHEDULED")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(options.limit ?? 5);

  if (options.groupIds) query = query.in("group_id", options.groupIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachGroupNames(db, data ?? []);
}

export async function getLesson(db: Db, id: string): Promise<LessonWithGroup | null> {
  const { data } = await db.from("lessons").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const [withGroup] = await attachGroupNames(db, [data]);
  return withGroup ?? null;
}

export async function createLesson(db: Db, input: LessonInput): Promise<Lesson> {
  const { data, error } = await db
    .from("lessons")
    .insert({
      title: input.title,
      group_id: input.groupId,
      start_time: toIso(input.startTime),
      end_time: toIso(input.endTime),
      meeting_url: normalizeMeetingUrl(input.meetingUrl),
      status: input.status,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export interface BulkLessonRow { title: string; startTime: string; endTime: string }

/** Inserts many lessons for one group (used by the recurring-lessons form). */
export async function createLessonsBulk(
  db: Db,
  groupId: string,
  meetingUrl: string | undefined,
  rows: BulkLessonRow[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const seriesId = crypto.randomUUID();
  const insert = rows.map((r) => ({
    title: r.title,
    group_id: groupId,
    start_time: toIso(r.startTime),
    end_time: toIso(r.endTime),
    meeting_url: normalizeMeetingUrl(meetingUrl),
    status: "SCHEDULED" as const,
    series_id: seriesId,
  }));
  const { error } = await db.from("lessons").insert(insert);
  if (error) throw new Error(error.message);
  return insert.length;
}

export interface LessonSeriesSummary {
  seriesId: string;
  groupName: string;
  title: string;
  count: number;
  firstStart: string;
  lastStart: string;
}

/** Recurring series that still have upcoming lessons, for the manage dialog. */
export async function listLessonSeries(db: Db): Promise<LessonSeriesSummary[]> {
  const now = new Date().toISOString();
  const { data } = await db
    .from("lessons")
    .select("series_id, group_id, title, start_time")
    .not("series_id", "is", null)
    .gte("start_time", now)
    .order("start_time", { ascending: true });
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const groupIds = [...new Set(rows.map((r) => r.group_id))];
  const { data: groups } = await db.from("groups").select("id, name").in("id", groupIds);
  const nameById = new Map((groups ?? []).map((g) => [g.id, g.name] as const));

  const bySeries = new Map<string, LessonSeriesSummary>();
  for (const r of rows) {
    const sid = r.series_id as string;
    const existing = bySeries.get(sid);
    if (!existing) {
      bySeries.set(sid, {
        seriesId: sid,
        groupName: nameById.get(r.group_id) ?? "—",
        title: r.title,
        count: 1,
        firstStart: r.start_time,
        lastStart: r.start_time,
      });
    } else {
      existing.count += 1;
      existing.lastStart = r.start_time;
    }
  }
  return [...bySeries.values()];
}

export interface SeriesEditData {
  title: string;
  meetingUrl: string | null;
  lessons: { id: string; start_time: string; end_time: string }[];
}

/** Upcoming lessons of a series plus the shared title/link, for editing. */
export async function getSeriesEditData(db: Db, seriesId: string): Promise<SeriesEditData> {
  const now = new Date().toISOString();
  const { data } = await db
    .from("lessons")
    .select("id, title, meeting_url, start_time, end_time")
    .eq("series_id", seriesId)
    .gte("start_time", now)
    .order("start_time", { ascending: true });
  const lessons = data ?? [];
  return {
    title: lessons[0]?.title ?? "",
    meetingUrl: lessons[0]?.meeting_url ?? null,
    lessons: lessons.map((l) => ({ id: l.id, start_time: l.start_time, end_time: l.end_time })),
  };
}

/** Applies title/link/time to each given lesson of a series. */
export async function updateLessonSeries(
  db: Db,
  title: string,
  meetingUrl: string | undefined,
  rows: { id: string; startTime: string; endTime: string }[],
): Promise<number> {
  for (const r of rows) {
    const { error } = await db
      .from("lessons")
      .update({
        title,
        meeting_url: normalizeMeetingUrl(meetingUrl),
        start_time: toIso(r.startTime),
        end_time: toIso(r.endTime),
      })
      .eq("id", r.id);
    if (error) throw new Error(error.message);
  }
  return rows.length;
}

/** Deletes all upcoming lessons of a whole series (by series id). */
export async function deleteLessonSeriesById(db: Db, seriesId: string): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("lessons")
    .delete()
    .eq("series_id", seriesId)
    .gte("start_time", now)
    .select("id");
  if (error) throw new Error(error.message);
  return (data ?? []).length;
}

/**
 * Deletes a recurring series from the given lesson onward (this lesson and every
 * later lesson sharing its series). A one-off lesson deletes just itself.
 */
export async function deleteLessonSeries(db: Db, lessonId: string): Promise<number> {
  const { data: lesson } = await db
    .from("lessons")
    .select("series_id, start_time")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return 0;
  if (!lesson.series_id) {
    await db.from("lessons").delete().eq("id", lessonId);
    return 1;
  }
  const { data: removed, error } = await db
    .from("lessons")
    .delete()
    .eq("series_id", lesson.series_id)
    .gte("start_time", lesson.start_time)
    .select("id");
  if (error) throw new Error(error.message);
  return (removed ?? []).length;
}

export async function updateLesson(db: Db, id: string, input: LessonInput): Promise<Lesson> {
  const { data, error } = await db
    .from("lessons")
    .update({
      title: input.title,
      group_id: input.groupId,
      start_time: toIso(input.startTime),
      end_time: toIso(input.endTime),
      meeting_url: normalizeMeetingUrl(input.meetingUrl),
      status: input.status,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setLessonStatus(db: Db, id: string, status: LessonStatus): Promise<void> {
  const { error } = await db.from("lessons").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLesson(db: Db, id: string): Promise<void> {
  const { error } = await db.from("lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface LessonOption {
  id: string;
  label: string;
}

/** Lesson options for selects (e.g. when attaching homework). */
export async function listLessonOptions(db: Db): Promise<LessonOption[]> {
  const { data } = await db
    .from("lessons")
    .select("id, title, group_id, start_time")
    .order("start_time", { ascending: false });
  const lessons = data ?? [];
  if (lessons.length === 0) return [];

  const groupIds = [...new Set(lessons.map((lesson) => lesson.group_id))];
  const { data: groups } = await db.from("groups").select("id, name").in("id", groupIds);
  const nameById = new Map((groups ?? []).map((group) => [group.id, group.name] as const));

  return lessons.map((lesson) => ({
    id: lesson.id,
    label: `${lesson.title} — ${nameById.get(lesson.group_id) ?? "—"}`,
  }));
}

/** Returns the lesson's group members with their present flag. */
export async function getLessonRoster(db: Db, lessonId: string): Promise<AttendanceRosterItem[]> {
  const { data: lesson } = await db
    .from("lessons")
    .select("group_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return [];

  const { data: links } = await db
    .from("group_members")
    .select("student_id")
    .eq("group_id", lesson.group_id);
  const studentIds = (links ?? []).map((link) => link.student_id);
  if (studentIds.length === 0) return [];

  const { data: students } = await db
    .from("students")
    .select("id, full_name")
    .in("id", studentIds)
    .order("full_name", { ascending: true });

  // Who actually entered the live session linked to this lesson.
  const { data: sess } = await db
    .from("live_sessions")
    .select("id")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  let presentSet = new Set<string>();
  if (sess) {
    const { data: attendance } = await db
      .from("live_session_attendance")
      .select("student_id")
      .eq("session_id", sess.id);
    presentSet = new Set((attendance ?? []).map((row) => row.student_id));
  }

  return (students ?? []).map((student) => ({
    studentId: student.id,
    fullName: student.full_name,
    present: presentSet.has(student.id),
  }));
}

/** Replaces the lesson's attendance with the given present students. */
export async function setLessonAttendance(
  db: Db,
  lessonId: string,
  presentStudentIds: string[],
): Promise<void> {
  const { data: lesson } = await db
    .from("lessons")
    .select("group_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) throw new Error("Занятие не найдено");

  const { data: links } = await db
    .from("group_members")
    .select("student_id")
    .eq("group_id", lesson.group_id);
  const memberSet = new Set((links ?? []).map((link) => link.student_id));
  const valid = [...new Set(presentStudentIds)].filter((id) => memberSet.has(id));

  const { error: deleteError } = await db
    .from("lesson_attendance")
    .delete()
    .eq("lesson_id", lessonId);
  if (deleteError) throw new Error(deleteError.message);

  if (valid.length > 0) {
    const rows = valid.map((studentId) => ({ lesson_id: lessonId, student_id: studentId }));
    const { error } = await db.from("lesson_attendance").insert(rows);
    if (error) throw new Error(error.message);
  }
}
