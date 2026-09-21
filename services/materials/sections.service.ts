import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { SectionRow } from "@/types";
import { swapForMove } from "./reorder";

export const HOMEWORK_SECTION_TITLE = "Домашние задания";

export async function listSections(db: Db, materialId: string): Promise<SectionRow[]> {
  const { data, error } = await db
    .from("material_sections")
    .select("*")
    .eq("material_id", materialId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** The homework section is auto-created with the material and always pinned last. */
export async function createHomeworkSection(db: Db, materialId: string): Promise<SectionRow> {
  const existing = await listSections(db, materialId);
  const position = existing.length === 0 ? 0 : Math.max(...existing.map((s) => s.position)) + 1;
  const { data, error } = await db
    .from("material_sections")
    .insert({ material_id: materialId, title: HOMEWORK_SECTION_TITLE, position, is_homework: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createSection(db: Db, materialId: string, title: string): Promise<SectionRow> {
  const existing = await listSections(db, materialId);
  const homework = existing.find((s) => s.is_homework);

  let position: number;
  if (homework) {
    // Insert just before the homework section, then push it back to keep it last.
    position = homework.position;
    const { error: bumpError } = await db
      .from("material_sections")
      .update({ position: homework.position + 1 })
      .eq("id", homework.id);
    if (bumpError) throw new Error(bumpError.message);
  } else {
    position = existing.length === 0 ? 0 : Math.max(...existing.map((s) => s.position)) + 1;
  }

  const { data, error } = await db
    .from("material_sections")
    .insert({ material_id: materialId, title, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSection(db: Db, id: string, title: string): Promise<void> {
  const { data: row } = await db.from("material_sections").select("is_homework").eq("id", id).maybeSingle();
  if (row?.is_homework) throw new Error("Раздел «Домашние задания» нельзя переименовать");
  const { error } = await db.from("material_sections").update({ title }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSection(db: Db, id: string): Promise<void> {
  const { data: row } = await db.from("material_sections").select("is_homework").eq("id", id).maybeSingle();
  if (row?.is_homework) throw new Error("Раздел «Домашние задания» нельзя удалить");
  const { error } = await db.from("material_sections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveSection(db: Db, id: string, direction: "up" | "down"): Promise<void> {
  const { data: row } = await db
    .from("material_sections")
    .select("material_id, is_homework")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  if (row.is_homework) throw new Error("Раздел «Домашние задания» всегда последний");
  // Reorder only among non-homework sections so the homework section stays last.
  const siblings = (await listSections(db, row.material_id)).filter((s) => !s.is_homework);
  const changes = swapForMove(siblings, id, direction);
  for (const c of changes) {
    const { error } = await db.from("material_sections").update({ position: c.position }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
