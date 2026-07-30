import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { MaterialInput } from "@/lib/validators";
import type { MaterialRow, MaterialWithCounts } from "@/types";

function nullable(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

export async function listMaterials(db: Db): Promise<MaterialWithCounts[]> {
  const { data, error } = await db
    .from("materials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const materials = data ?? [];

  const { data: sections } = await db.from("material_sections").select("material_id");
  const counts = new Map<string, number>();
  for (const s of sections ?? []) counts.set(s.material_id, (counts.get(s.material_id) ?? 0) + 1);

  return materials.map((m) => ({ ...m, sectionCount: counts.get(m.id) ?? 0 }));
}

export async function getMaterial(db: Db, id: string): Promise<MaterialRow | null> {
  const { data } = await db.from("materials").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function createMaterial(db: Db, input: MaterialInput): Promise<MaterialRow> {
  const { data, error } = await db
    .from("materials")
    .insert({
      title: input.title,
      description: nullable(input.description),
      cover_url: nullable(input.coverUrl),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMaterial(db: Db, id: string, input: MaterialInput): Promise<void> {
  const { error } = await db
    .from("materials")
    .update({
      title: input.title,
      description: nullable(input.description),
      cover_url: nullable(input.coverUrl),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMaterial(db: Db, id: string): Promise<void> {
  const { error } = await db.from("materials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
