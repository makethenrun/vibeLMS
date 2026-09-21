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

export async function setMaterialLanguage(db: Db, id: string, language: string | null): Promise<void> {
  const value = language && language.trim() !== "" ? language.trim() : null;
  const { error } = await db
    .from("materials")
    .update({ language: value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Deep-copies a material and its whole content tree (sections → lessons →
 * modules → items), but NOT student results/submissions and NOT any access
 * settings (group access or per-lesson access rules). Item pins are also dropped
 * since they tie items to specific groups.
 */
export async function duplicateMaterial(db: Db, sourceId: string): Promise<MaterialRow> {
  const source = await getMaterial(db, sourceId);
  if (!source) throw new Error("Материал не найден");

  const { data: newMat, error: mErr } = await db
    .from("materials")
    .insert({
      title: `${source.title} (копия)`,
      description: source.description,
      cover_url: source.cover_url,
      language: source.language,
    })
    .select()
    .single();
  if (mErr) throw new Error(mErr.message);

  // Sections
  const { data: sections } = await db
    .from("material_sections")
    .select("*")
    .eq("material_id", sourceId)
    .order("position", { ascending: true });
  const sectionIdMap = new Map<string, string>();
  for (const s of sections ?? []) {
    const { data: ns, error } = await db
      .from("material_sections")
      .insert({ material_id: newMat.id, title: s.title, position: s.position, is_homework: s.is_homework })
      .select()
      .single();
    if (error) throw new Error(error.message);
    sectionIdMap.set(s.id, ns.id);
  }

  // Lessons
  const sectionIds = (sections ?? []).map((s) => s.id);
  const lessons = sectionIds.length
    ? (await db.from("material_lessons").select("*").in("section_id", sectionIds).order("position", { ascending: true })).data ?? []
    : [];
  const lessonIdMap = new Map<string, string>();
  for (const l of lessons) {
    const { data: nl, error } = await db
      .from("material_lessons")
      .insert({
        section_id: sectionIdMap.get(l.section_id)!,
        title: l.title,
        position: l.position,
        background_url: l.background_url,
        background_dim: l.background_dim,
        background_fit: l.background_fit,
        background_position: l.background_position,
        background_scale: l.background_scale,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    lessonIdMap.set(l.id, nl.id);
  }

  // Modules
  const lessonIds = lessons.map((l) => l.id);
  const modules = lessonIds.length
    ? (await db.from("material_modules").select("*").in("lesson_id", lessonIds).order("position", { ascending: true })).data ?? []
    : [];
  const moduleIdMap = new Map<string, string>();
  for (const mod of modules) {
    const { data: nm, error } = await db
      .from("material_modules")
      .insert({ lesson_id: lessonIdMap.get(mod.lesson_id)!, title: mod.title, position: mod.position })
      .select()
      .single();
    if (error) throw new Error(error.message);
    moduleIdMap.set(mod.id, nm.id);
  }

  // Items (bulk)
  const moduleIds = modules.map((m) => m.id);
  if (moduleIds.length) {
    const { data: items } = await db
      .from("material_items")
      .select("*")
      .in("module_id", moduleIds)
      .order("position", { ascending: true });
    const rows = (items ?? []).map((it) => ({
      module_id: moduleIdMap.get(it.module_id)!,
      position: it.position,
      type: it.type,
      title: it.title,
      note: it.note,
      note_hidden: it.note_hidden,
      retry_disabled: it.retry_disabled,
      font_family: it.font_family,
      font_size: it.font_size,
      explanation: it.explanation,
      drawing: it.drawing,
      vocab: it.vocab,
      unnumbered: it.unnumbered,
      content: it.content,
    }));
    if (rows.length) {
      const { error } = await db.from("material_items").insert(rows);
      if (error) throw new Error(error.message);
    }
  }

  return newMat;
}

export async function deleteMaterial(db: Db, id: string): Promise<void> {
  const { error } = await db.from("materials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
