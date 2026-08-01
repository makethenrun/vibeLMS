import "server-only";

import type { Db } from "@/lib/db/supabase";

/** Map of item id → pinned group ids, for a set of items (e.g. a module). */
export async function getPinsForItems(db: Db, itemIds: string[]): Promise<Record<string, string[]>> {
  if (itemIds.length === 0) return {};
  const { data, error } = await db
    .from("material_item_pins")
    .select("item_id, group_id")
    .in("item_id", itemIds);
  if (error) throw new Error(error.message);
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    (map[row.item_id] ??= []).push(row.group_id);
  }
  return map;
}

export async function setItemPins(db: Db, itemId: string, groupIds: string[]): Promise<void> {
  const { error: delErr } = await db.from("material_item_pins").delete().eq("item_id", itemId);
  if (delErr) throw new Error(delErr.message);
  if (groupIds.length === 0) return;
  const rows = groupIds.map((group_id) => ({ item_id: itemId, group_id }));
  const { error } = await db.from("material_item_pins").insert(rows);
  if (error) throw new Error(error.message);
}
