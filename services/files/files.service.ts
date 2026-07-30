import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { FileInput } from "@/lib/validators";
import type { FileRecord } from "@/types";

export async function listFiles(db: Db): Promise<FileRecord[]> {
  const { data, error } = await db
    .from("files")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFile(db: Db, id: string): Promise<FileRecord | null> {
  const { data } = await db.from("files").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function createFile(db: Db, input: FileInput): Promise<FileRecord> {
  const { data, error } = await db
    .from("files")
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

export async function deleteFile(db: Db, id: string): Promise<void> {
  const { error } = await db.from("files").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
