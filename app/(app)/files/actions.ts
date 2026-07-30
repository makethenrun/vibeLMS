"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fileSchema, type FileInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { createFile, deleteFile, getFile } from "@/services/files/files.service";
import { removeFileByUrl } from "@/services/storage/storage.service";

export async function createFileAction(input: FileInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = fileSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await createFile(db, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/files");
  return ok();
}

export async function deleteFileAction(id: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    const file = await getFile(db, id);
    await deleteFile(db, id);
    // Clean up the stored file (no-op for external video links).
    if (file) await removeFileByUrl(db, file.file_url);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/files");
  return ok();
}
