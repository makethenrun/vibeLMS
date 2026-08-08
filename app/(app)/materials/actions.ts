"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { itemContentSchema, itemMetaSchema, lessonBackgroundSchema, materialSchema, titleSchema, type MaterialInput } from "@/lib/validators";
import * as materials from "@/services/materials/materials.service";
import * as sections from "@/services/materials/sections.service";
import * as lessons from "@/services/materials/lessons.service";
import * as modules from "@/services/materials/modules.service";
import * as items from "@/services/materials/items.service";
import { setMaterialGroups } from "@/services/materials/material-groups.service";
import { setItemPins } from "@/services/materials/item-pins.service";
import { getSectionsWithLessons } from "@/services/materials/sections-tree.service";
import { gradeSubmission, setReaction } from "@/services/materials/submissions.service";

type Dir = "up" | "down";

export interface PickerOption {
  id: string;
  title: string;
}
export interface PickerLessonGroup {
  sectionTitle: string;
  lessons: PickerOption[];
}

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
  revalidatePath("/materials", "layout");
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

export async function setLessonBackgroundAction(lessonId: string, input: unknown): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = lessonBackgroundSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте параметры фона", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await lessons.setLessonBackground(db, lessonId, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  revalidatePath("/learn", "layout");
  return ok();
}

// --- Modules -----------------------------------------------------------------

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

// --- Items (attached to a module) -------------------------------------------

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
  revalidatePath("/materials", "layout");
  return ok();
}

export async function updateItemAction(id: string, content: unknown): Promise<ActionResult> {
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
  revalidatePath("/materials", "layout");
  return ok();
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await items.deleteItem(db, id);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function moveItemAction(id: string, direction: Dir): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await items.moveItem(db, id, direction);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function updateItemMetaAction(id: string, meta: unknown): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const parsed = itemMetaSchema.safeParse(meta);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);
  const db = createServerSupabaseClient();
  try {
    await items.updateItemMeta(db, id, parsed.data);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function setItemPinsAction(itemId: string, groupIds: string[]): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await setItemPins(db, itemId, groupIds);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

export async function importItemsAction(itemIds: string[], targetModuleId: string): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  if (itemIds.length === 0) return fail("Не выбрано ни одного упражнения");
  const db = createServerSupabaseClient();
  try {
    await items.copyItemsToModule(db, itemIds, targetModuleId);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath("/materials", "layout");
  return ok();
}

// --- Material groups access -------------------------------------------------

export async function gradeSubmissionAction(
  studentId: string,
  itemId: string,
  score: number,
  materialId: string,
): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  if (!Number.isFinite(score) || score < 0 || score > 100) return fail("Балл должен быть от 0 до 100");
  const db = createServerSupabaseClient();
  try {
    await gradeSubmission(db, studentId, itemId, Math.round(score));
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/${materialId}/results`);
  return ok();
}

export async function setReactionAction(
  studentId: string,
  itemId: string,
  reaction: string | null,
  materialId: string,
): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await setReaction(db, studentId, itemId, reaction);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/${materialId}/results/${studentId}`);
  return ok();
}

export async function setMaterialGroupsAction(materialId: string, groupIds: string[]): Promise<ActionResult> {
  const denied = await requireTutorResult();
  if (denied) return denied;
  const db = createServerSupabaseClient();
  try {
    await setMaterialGroups(db, materialId, groupIds);
  } catch (e) {
    return fail(getErrorMessage(e));
  }
  revalidatePath(`/materials/${materialId}`);
  return ok();
}

// --- Import target pickers (data fetchers) ----------------------------------

export async function pickerMaterialsAction(): Promise<PickerOption[]> {
  const tutor = await getTutorOrNull();
  if (!tutor) return [];
  const db = createServerSupabaseClient();
  const list = await materials.listMaterials(db);
  return list.map((m) => ({ id: m.id, title: m.title }));
}

export async function pickerLessonsAction(materialId: string): Promise<PickerLessonGroup[]> {
  const tutor = await getTutorOrNull();
  if (!tutor) return [];
  const db = createServerSupabaseClient();
  const tree = await getSectionsWithLessons(db, materialId);
  return tree.map((s) => ({
    sectionTitle: s.title,
    lessons: s.lessons.map((l) => ({ id: l.id, title: l.title })),
  }));
}

export async function pickerModulesAction(lessonId: string): Promise<PickerOption[]> {
  const tutor = await getTutorOrNull();
  if (!tutor) return [];
  const db = createServerSupabaseClient();
  const list = await modules.listModules(db, lessonId);
  return list.map((m) => ({ id: m.id, title: m.title }));
}
