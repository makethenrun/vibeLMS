import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";

export interface AssistantRow {
  id: string;
  login: string;
  groupIds: string[];
  materials: { materialId: string; canEdit: boolean }[];
}

export async function createAssistant(db: Db, login: string, password: string): Promise<string> {
  const password_hash = await hashPassword(password);
  const { data, error } = await db
    .from("users")
    .insert({ login, password_hash, role: "ASSISTANT" })
    .select("id")
    .single();
  if (error) throw new Error(error.message.includes("duplicate") ? "Логин уже занят" : error.message);
  return data.id;
}

export async function deleteAssistant(db: Db, assistantId: string): Promise<void> {
  const { error } = await db.from("users").delete().eq("id", assistantId).eq("role", "ASSISTANT");
  if (error) throw new Error(error.message);
}

export async function listAssistants(db: Db): Promise<AssistantRow[]> {
  const { data: users } = await db
    .from("users")
    .select("id, login")
    .eq("role", "ASSISTANT")
    .order("login", { ascending: true });
  const rows = users ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map((u) => u.id);

  const { data: ag } = await db.from("assistant_groups").select("assistant_id, group_id").in("assistant_id", ids);
  const { data: am } = await db.from("assistant_materials").select("assistant_id, material_id, can_edit").in("assistant_id", ids);

  const groupsByAssistant = new Map<string, string[]>();
  for (const r of ag ?? []) groupsByAssistant.set(r.assistant_id, [...(groupsByAssistant.get(r.assistant_id) ?? []), r.group_id]);
  const matsByAssistant = new Map<string, { materialId: string; canEdit: boolean }[]>();
  for (const r of am ?? []) matsByAssistant.set(r.assistant_id, [...(matsByAssistant.get(r.assistant_id) ?? []), { materialId: r.material_id, canEdit: r.can_edit }]);

  return rows.map((u) => ({
    id: u.id,
    login: u.login,
    groupIds: groupsByAssistant.get(u.id) ?? [],
    materials: matsByAssistant.get(u.id) ?? [],
  }));
}

export async function setAssistantGroups(db: Db, assistantId: string, groupIds: string[]): Promise<void> {
  await db.from("assistant_groups").delete().eq("assistant_id", assistantId);
  if (groupIds.length > 0) {
    const { error } = await db.from("assistant_groups").insert(groupIds.map((group_id) => ({ assistant_id: assistantId, group_id })));
    if (error) throw new Error(error.message);
  }
}

export async function setAssistantMaterials(db: Db, assistantId: string, entries: { materialId: string; canEdit: boolean }[]): Promise<void> {
  await db.from("assistant_materials").delete().eq("assistant_id", assistantId);
  if (entries.length > 0) {
    const { error } = await db
      .from("assistant_materials")
      .insert(entries.map((e) => ({ assistant_id: assistantId, material_id: e.materialId, can_edit: e.canEdit })));
    if (error) throw new Error(error.message);
  }
}

// --- Access helpers (used by page loaders and action guards) ----------------

export async function assistantGroupIds(db: Db, assistantId: string): Promise<string[]> {
  const { data } = await db.from("assistant_groups").select("group_id").eq("assistant_id", assistantId);
  return (data ?? []).map((r) => r.group_id);
}

/** Map material id → can_edit for an assistant (only assigned materials appear). */
export async function assistantMaterialAccess(db: Db, assistantId: string): Promise<Map<string, boolean>> {
  const { data } = await db.from("assistant_materials").select("material_id, can_edit").eq("assistant_id", assistantId);
  return new Map((data ?? []).map((r) => [r.material_id, r.can_edit] as const));
}

/** Whether the user may VIEW a material (tutor: all; assistant: assigned). */
export async function canViewMaterial(db: Db, user: CurrentUser, materialId: string): Promise<boolean> {
  if (user.role === "TUTOR") return true;
  if (user.role !== "ASSISTANT") return false;
  const { data } = await db
    .from("assistant_materials")
    .select("material_id")
    .eq("assistant_id", user.id)
    .eq("material_id", materialId)
    .maybeSingle();
  return Boolean(data);
}

/** Whether the user may EDIT a material (tutor: all; assistant: assigned + can_edit). */
export async function canEditMaterial(db: Db, user: CurrentUser, materialId: string): Promise<boolean> {
  if (user.role === "TUTOR") return true;
  if (user.role !== "ASSISTANT") return false;
  const { data } = await db
    .from("assistant_materials")
    .select("can_edit")
    .eq("assistant_id", user.id)
    .eq("material_id", materialId)
    .maybeSingle();
  return Boolean(data?.can_edit);
}

/** Whether the user may run sessions for / view a group. */
export async function canAccessGroup(db: Db, user: CurrentUser, groupId: string): Promise<boolean> {
  if (user.role === "TUTOR") return true;
  if (user.role !== "ASSISTANT") return false;
  const { data } = await db
    .from("assistant_groups")
    .select("group_id")
    .eq("assistant_id", user.id)
    .eq("group_id", groupId)
    .maybeSingle();
  return Boolean(data);
}

type Node = "material" | "section" | "lesson" | "module" | "item";

/** Resolves the owning material id for a section/lesson/module/item (or itself). */
export async function resolveMaterialId(db: Db, kind: Node, id: string): Promise<string | null> {
  if (kind === "material") return id;
  let moduleId: string | null = null;
  let lessonId: string | null = null;
  let sectionId: string | null = null;

  if (kind === "item") {
    const { data } = await db.from("material_items").select("module_id").eq("id", id).maybeSingle();
    moduleId = data?.module_id ?? null;
    if (!moduleId) return null;
  }
  if (kind === "module" || moduleId) {
    const mid = kind === "module" ? id : moduleId!;
    const { data } = await db.from("material_modules").select("lesson_id").eq("id", mid).maybeSingle();
    lessonId = data?.lesson_id ?? null;
    if (!lessonId) return null;
  }
  if (kind === "lesson" || lessonId) {
    const lid = kind === "lesson" ? id : lessonId!;
    const { data } = await db.from("material_lessons").select("section_id").eq("id", lid).maybeSingle();
    sectionId = data?.section_id ?? null;
    if (!sectionId) return null;
  }
  const sid = kind === "section" ? id : sectionId!;
  const { data } = await db.from("material_sections").select("material_id").eq("id", sid).maybeSingle();
  return data?.material_id ?? null;
}
