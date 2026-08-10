import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ItemContent, ItemMetaInput } from "@/lib/validators";
import type { ItemRow, Json } from "@/types";
import { swapForMove } from "./reorder";

function nullable(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

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

export async function updateItemMeta(db: Db, id: string, meta: ItemMetaInput): Promise<void> {
  const { error } = await db
    .from("material_items")
    .update({
      title: nullable(meta.title),
      note: nullable(meta.note),
      note_hidden: meta.noteHidden,
      retry_disabled: meta.retryDisabled,
      font_family: meta.fontFamily,
      font_size: meta.fontSize,
      explanation: nullable(meta.explanation),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setItemDrawing(db: Db, id: string, drawing: string | null): Promise<void> {
  const { error } = await db
    .from("material_items")
    .update({ drawing, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Copies the given items (in order) to the end of a target module. */
export async function copyItemsToModule(db: Db, itemIds: string[], targetModuleId: string): Promise<number> {
  if (itemIds.length === 0) return 0;

  const { data: sources, error: srcErr } = await db
    .from("material_items")
    .select("*")
    .in("id", itemIds);
  if (srcErr) throw new Error(srcErr.message);
  if (!sources || sources.length === 0) return 0;

  // Preserve the selection order the caller passed in.
  const orderById = new Map(itemIds.map((id, i) => [id, i] as const));
  const ordered = [...sources].sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));

  const existing = await listItems(db, targetModuleId);
  let position = existing.length === 0 ? 0 : Math.max(...existing.map((i) => i.position)) + 1;

  const rows = ordered.map((s) => ({
    module_id: targetModuleId,
    position: position++,
    type: s.type,
    title: s.title,
    note: s.note,
    note_hidden: s.note_hidden,
    content: s.content,
  }));

  const { error } = await db.from("material_items").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
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
