import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { LessonInput } from "@/lib/validators";
import type { Lesson, LessonStatus, LessonWithGroup } from "@/types";

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
