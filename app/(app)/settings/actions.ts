"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { settingsSchema, type SettingsInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { updateSettings } from "@/services/settings/settings.service";

export async function updateSettingsAction(input: SettingsInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await updateSettings(db, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  // The organisation name/logo live in the shared app layout — revalidate it.
  revalidatePath("/", "layout");
  return ok();
}
