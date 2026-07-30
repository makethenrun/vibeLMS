"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { itemContentSchema, materialSchema, titleSchema, type MaterialInput } from "@/lib/validators";
import * as materials from "@/services/materials/materials.service";
import * as sections from "@/services/materials/sections.service";
import * as lessons from "@/services/materials/lessons.service";
import * as modules from "@/services/materials/modules.service";
import * as items from "@/services/materials/items.service";

type Dir = "up" | "down";

async function requireTutorResult(): Promise<ActionResult | null> {
  const tutor = await getTutorOrNull();
  return tutor ? null : fail("Недостаточно прав");
}

// --- Materials --------------------------------------------------------------

export async function createMaterialAction(input: MaterialInput): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await materials.createMaterial(db, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials");
  return ok();
}

export async function updateMaterialAction(id: string, input: MaterialInput): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await materials.updateMaterial(db, id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials");
  revalidatePath(`/materials/${id}`);
  return ok();
}

export async function deleteMaterialAction(id: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await materials.deleteMaterial(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials");
  return ok();
}

// --- Sections ---------------------------------------------------------------

export async function createSectionAction(materialId: string, title: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = titleSchema.safeParse({ title });
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await sections.createSection(db, materialId, parsed.data.title);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/${materialId}`);
  return ok();
}

export async function updateSectionAction(id: string, title: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = titleSchema.safeParse({ title });
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await sections.updateSection(db, id, parsed.data.title);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function deleteSectionAction(id: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await sections.deleteSection(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function moveSectionAction(id: string, direction: Dir): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await sections.moveSection(db, id, direction);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

// --- Lessons ----------------------------------------------------------------

export async function createLessonAction(sectionId: string, title: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = titleSchema.safeParse({ title });
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await lessons.createLesson(db, sectionId, parsed.data.title);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/sections/${sectionId}`);
  return ok();
}

export async function updateLessonAction(id: string, title: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = titleSchema.safeParse({ title });
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await lessons.updateLesson(db, id, parsed.data.title);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function deleteLessonAction(id: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await lessons.deleteLesson(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function moveLessonAction(id: string, direction: Dir): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await lessons.moveLesson(db, id, direction);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

// --- Modules ----------------------------------------------------------------

export async function createModuleAction(lessonId: string, title: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = titleSchema.safeParse({ title });
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await modules.createModule(db, lessonId, parsed.data.title);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/lessons/${lessonId}`);
  return ok();
}

export async function updateModuleAction(id: string, title: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = titleSchema.safeParse({ title });
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await modules.updateModule(db, id, parsed.data.title);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function deleteModuleAction(id: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await modules.deleteModule(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function moveModuleAction(id: string, direction: Dir): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await modules.moveModule(db, id, direction);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

// --- Items ------------------------------------------------------------------

export async function createItemAction(moduleId: string, content: unknown): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = itemContentSchema.safeParse(content);
  if (!parsed.success) return fail("Проверьте упражнение", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await items.createItem(db, moduleId, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/modules/${moduleId}`);
  return ok();
}

export async function updateItemAction(id: string, moduleId: string, content: unknown): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = itemContentSchema.safeParse(content);
  if (!parsed.success) return fail("Проверьте упражнение", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await items.updateItemContent(db, id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/modules/${moduleId}`);
  return ok();
}

export async function deleteItemAction(id: string, moduleId: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await items.deleteItem(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/modules/${moduleId}`);
  return ok();
}

export async function moveItemAction(id: string, moduleId: string, direction: Dir): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await items.moveItem(db, id, direction);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/modules/${moduleId}`);
  return ok();
}
