import "server-only";

import { randomUUID } from "node:crypto";

import type { Db } from "@/lib/db/supabase";
import { getServerEnv } from "@/lib/env";

export interface UploadedFile {
  url: string;
  path: string;
}

function fileExtension(name: string): string {
  const parts = name.split(".");
  if (parts.length < 2) return "";
  const ext = parts[parts.length - 1]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  return ext ? `.${ext}` : "";
}

/** Uploads a file to the configured Supabase Storage bucket and returns its public URL. */
export async function uploadFile(
  db: Db,
  params: { file: File; folder: string },
): Promise<UploadedFile> {
  const { STORAGE_BUCKET } = getServerEnv();
  const path = `${params.folder}/${randomUUID()}${fileExtension(params.file.name)}`;
  const arrayBuffer = await params.file.arrayBuffer();

  const { error } = await db.storage.from(STORAGE_BUCKET).upload(path, arrayBuffer, {
    contentType: params.file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Removes a previously uploaded file given its public URL. No-op for external links. */
export async function removeFileByUrl(db: Db, url: string): Promise<void> {
  const { STORAGE_BUCKET } = getServerEnv();
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const path = decodeURIComponent(url.slice(index + marker.length));
  if (!path) return;
  await db.storage.from(STORAGE_BUCKET).remove([path]);
}
