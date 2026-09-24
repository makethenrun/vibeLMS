import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ModuleRow } from "@/types";
import { swapForMove } from "./reorder";

export async function listModules(db: Db, lessonId: string): Promise<ModuleRow[]> {
  const { data, error } = await db
    .from("material_modules")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const HOMEWORK_MODULE_TITLE = "Домашние задания";

/** The homework module is auto-created with the lesson and always pinned last. */
export async function createHomeworkModule(db: Db, lessonId: string): Promise<ModuleRow> {
  const existing = await listModules(db, lessonId);
  const position = existing.length === 0 ? 0 : Math.max(...existing.map((m) => m.position)) + 1;
  const { data, error } = await db
    .from("material_modules")
    .insert({ lesson_id: lessonId, title: HOMEWORK_MODULE_TITLE, position, is_homework: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createModule(db: Db, lessonId: string, title: string): Promise<ModuleRow> {
  const existing = await listModules(db, lessonId);
  const homework = existing.find((m) => m.is_homework);

  let position: number;
  if (homework) {
    // Insert just before the homework module, then push it back to stay last.
    position = homework.position;
    const { error: bumpError } = await db
      .from("material_modules")
      .update({ position: homework.position + 1 })
      .eq("id", homework.id);
    if (bumpError) throw new Error(bumpError.message);
  } else {
    position = existing.length === 0 ? 0 : Math.max(...existing.map((m) => m.position)) + 1;
  }

  const { data, error } = await db
    .from("material_modules")
    .insert({ lesson_id: lessonId, title, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateModule(db: Db, id: string, title: string): Promise<void> {
  const { data: row } = await db.from("material_modules").select("is_homework").eq("id", id).maybeSingle();
  if (row?.is_homework) throw new Error("Модуль «Домашние задания» нельзя переименовать");
  const { error } = await db.from("material_modules").update({ title }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteModule(db: Db, id: string): Promise<void> {
  const { data: row } = await db.from("material_modules").select("is_homework").eq("id", id).maybeSingle();
  if (row?.is_homework) throw new Error("Модуль «Домашние задания» нельзя удалить");
  const { error } = await db.from("material_modules").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveModule(db: Db, id: string, direction: "up" | "down"): Promise<void> {
  const { data: row } = await db
    .from("material_modules")
    .select("lesson_id, is_homework")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  if (row.is_homework) throw new Error("Модуль «Домашние задания» всегда последний");
  // Reorder only among non-homework modules so the homework module stays last.
  const siblings = (await listModules(db, row.lesson_id)).filter((m) => !m.is_homework);
  const changes = swapForMove(siblings, id, direction);
  for (const c of changes) {
    const { error } = await db.from("material_modules").update({ position: c.position }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
