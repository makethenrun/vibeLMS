"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { materialSchema, type MaterialInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import {
  createMaterial,
  deleteMaterial,
  getMaterial,
} from "@/services/materials/materials.service";
import { removeFileByUrl } from "@/services/storage/storage.service";

export async function createMaterialAction(input: MaterialInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await createMaterial(db, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/materials");
  return ok();
}

export async function deleteMaterialAction(id: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    const material = await getMaterial(db, id);
    await deleteMaterial(db, id);
    // Clean up the stored file (no-op for external video links).
    if (material) await removeFileByUrl(db, material.file_url);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/materials");
  return ok();
}
