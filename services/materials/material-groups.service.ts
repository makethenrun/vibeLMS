import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { Group } from "@/types";

export async function listMaterialGroupIds(db: Db, materialId: string): Promise<string[]> {
  const { data, error } = await db
    .from("material_groups")
    .select("group_id")
    .eq("material_id", materialId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.group_id);
}

/** The groups that have access to a material (used for access + pin pickers). */
export async function getAccessibleGroups(db: Db, materialId: string): Promise<Group[]> {
  const ids = await listMaterialGroupIds(db, materialId);
  if (ids.length === 0) return [];
  const { data, error } = await db.from("groups").select("*").in("id", ids).order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setMaterialGroups(db: Db, materialId: string, groupIds: string[]): Promise<void> {
  const { error: delErr } = await db.from("material_groups").delete().eq("material_id", materialId);
  if (delErr) throw new Error(delErr.message);
  if (groupIds.length === 0) return;
  const rows = groupIds.map((group_id) => ({ material_id: materialId, group_id }));
  const { error } = await db.from("material_groups").insert(rows);
  if (error) throw new Error(error.message);
}
