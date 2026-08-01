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

export async function createModule(db: Db, lessonId: string, title: string): Promise<ModuleRow> {
  const existing = await listModules(db, lessonId);
  const position = existing.length === 0 ? 0 : Math.max(...existing.map((m) => m.position)) + 1;
  const { data, error } = await db
    .from("material_modules")
    .insert({ lesson_id: lessonId, title, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateModule(db: Db, id: string, title: string): Promise<void> {
  const { error } = await db.from("material_modules").update({ title }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteModule(db: Db, id: string): Promise<void> {
  const { error } = await db.from("material_modules").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveModule(db: Db, id: string, direction: "up" | "down"): Promise<void> {
  const { data: row } = await db
    .from("material_modules")
    .select("lesson_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  const siblings = await listModules(db, row.lesson_id);
  const changes = swapForMove(siblings, id, direction);
  for (const c of changes) {
    const { error } = await db.from("material_modules").update({ position: c.position }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
