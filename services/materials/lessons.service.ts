import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { LessonBackgroundInput } from "@/lib/validators";
import type { LessonRow } from "@/types";
import { swapForMove } from "./reorder";

export interface LessonBackground {
  url: string | null;
  dim: number;
  fit: "cover" | "contain" | "tile";
  position: "top" | "center" | "bottom";
  scale: number;
}

export async function getLessonBackground(db: Db, lessonId: string): Promise<LessonBackground> {
  const { data } = await db
    .from("material_lessons")
    .select("background_url, background_dim, background_fit, background_position, background_scale")
    .eq("id", lessonId)
    .maybeSingle();
  return {
    url: data?.background_url ?? null,
    dim: data?.background_dim ?? 0,
    fit: (data?.background_fit as LessonBackground["fit"]) ?? "cover",
    position: (data?.background_position as LessonBackground["position"]) ?? "center",
    scale: data?.background_scale ?? 100,
  };
}

export async function setLessonBackground(db: Db, lessonId: string, input: LessonBackgroundInput): Promise<void> {
  const url = input.url && input.url.trim() !== "" ? input.url.trim() : null;
  const { error } = await db
    .from("material_lessons")
    .update({
      background_url: url,
      background_dim: url ? input.dim : 0,
      background_fit: input.fit,
      background_position: input.position,
      background_scale: input.scale,
    })
    .eq("id", lessonId);
  if (error) throw new Error(error.message);
}

export async function listLessons(db: Db, sectionId: string): Promise<LessonRow[]> {
  const { data, error } = await db
    .from("material_lessons")
    .select("*")
    .eq("section_id", sectionId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createLesson(db: Db, sectionId: string, title: string): Promise<LessonRow> {
  const existing = await listLessons(db, sectionId);
  const position = existing.length === 0 ? 0 : Math.max(...existing.map((l) => l.position)) + 1;
  const { data, error } = await db
    .from("material_lessons")
    .insert({ section_id: sectionId, title, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateLesson(db: Db, id: string, title: string): Promise<void> {
  const { error } = await db.from("material_lessons").update({ title }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLesson(db: Db, id: string): Promise<void> {
  const { error } = await db.from("material_lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveLesson(db: Db, id: string, direction: "up" | "down"): Promise<void> {
  const { data: row } = await db
    .from("material_lessons")
    .select("section_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  const siblings = await listLessons(db, row.section_id);
  const changes = swapForMove(siblings, id, direction);
  for (const c of changes) {
    const { error } = await db.from("material_lessons").update({ position: c.position }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
