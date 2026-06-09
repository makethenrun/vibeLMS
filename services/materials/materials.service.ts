import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { MaterialInput } from "@/lib/validators";
import type { Material } from "@/types";

export async function listMaterials(db: Db): Promise<Material[]> {
  const { data, error } = await db
    .from("materials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMaterial(db: Db, id: string): Promise<Material | null> {
  const { data } = await db.from("materials").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function createMaterial(db: Db, input: MaterialInput): Promise<Material> {
  const { data, error } = await db
    .from("materials")
    .insert({
      title: input.title,
      file_url: input.fileUrl,
      material_type: input.materialType,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMaterial(db: Db, id: string): Promise<void> {
  const { error } = await db.from("materials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
