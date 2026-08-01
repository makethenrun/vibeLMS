import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ItemContent } from "@/lib/validators";
import type { ItemRow, Json } from "@/types";
import { swapForMove } from "./reorder";

// ItemContent is validated app-side; it serialises cleanly to JSONB but the
// structural `Json` type does not accept `Record<string, unknown>` (INFO doc),
// so we widen through `unknown` at the DB boundary.
function toJson(content: ItemContent): Json {
  return content as unknown as Json;
}

export async function listItems(db: Db, moduleId: string): Promise<ItemRow[]> {
  const { data, error } = await db
    .from("material_items")
    .select("*")
    .eq("module_id", moduleId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createItem(db: Db, moduleId: string, content: ItemContent): Promise<ItemRow> {
  const existing = await listItems(db, moduleId);
  const position = existing.length === 0 ? 0 : Math.max(...existing.map((i) => i.position)) + 1;
  const { data, error } = await db
    .from("material_items")
    .insert({ module_id: moduleId, type: content.type, content: toJson(content), position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateItemContent(db: Db, id: string, content: ItemContent): Promise<void> {
  const { error } = await db
    .from("material_items")
    .update({ type: content.type, content: toJson(content), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteItem(db: Db, id: string): Promise<void> {
  const { error } = await db.from("material_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveItem(db: Db, id: string, direction: "up" | "down"): Promise<void> {
  const { data: row } = await db
    .from("material_items")
    .select("module_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  const siblings = await listItems(db, row.module_id);
  const changes = swapForMove(siblings, id, direction);
  for (const c of changes) {
    const { error } = await db.from("material_items").update({ position: c.position }).eq("id", c.id);
    if (error) throw new Error(error.message);
  }
}
