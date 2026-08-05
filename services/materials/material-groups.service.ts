import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { Group, MaterialRow } from "@/types";

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

/** Materials that a given group has access to (for the group detail page). */
export async function listGroupMaterials(db: Db, groupId: string): Promise<MaterialRow[]> {
  const { data: links, error: linkErr } = await db
    .from("material_groups")
    .select("material_id")
    .eq("group_id", groupId);
  if (linkErr) throw new Error(linkErr.message);
  const ids = [...new Set((links ?? []).map((r) => r.material_id))];
  if (ids.length === 0) return [];

  const { data, error } = await db
    .from("materials")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });
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
