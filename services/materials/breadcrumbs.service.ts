import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { Breadcrumb } from "@/types";

export interface CrumbResult {
  crumbs: Breadcrumb[];
  parentId: string;
  title: string;
}

const MATERIALS_CRUMB: Breadcrumb = { label: "Материалы", href: "/materials" };

export async function sectionCrumbs(db: Db, sectionId: string): Promise<CrumbResult | null> {
  const { data: section } = await db
    .from("material_sections")
    .select("id, title, material_id")
    .eq("id", sectionId)
    .maybeSingle();
  if (!section) return null;
  const { data: material } = await db
    .from("materials")
    .select("id, title")
    .eq("id", section.material_id)
    .maybeSingle();
  if (!material) return null;
  return {
    parentId: material.id,
    title: section.title,
    crumbs: [
      MATERIALS_CRUMB,
      { label: material.title, href: `/materials/${material.id}` },
      { label: section.title, href: `/materials/sections/${section.id}` },
    ],
  };
}

export async function lessonCrumbs(db: Db, lessonId: string): Promise<CrumbResult | null> {
  const { data: lesson } = await db
    .from("material_lessons")
    .select("id, title, section_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return null;
  const { data: section } = await db
    .from("material_sections")
    .select("id, title, material_id")
    .eq("id", lesson.section_id)
    .maybeSingle();
  if (!section) return null;
  const { data: material } = await db
    .from("materials")
    .select("id, title")
    .eq("id", section.material_id)
    .maybeSingle();
  if (!material) return null;
  return {
    parentId: section.id,
    title: lesson.title,
    crumbs: [
      MATERIALS_CRUMB,
      { label: material.title, href: `/materials/${material.id}` },
      { label: section.title, href: `/materials/sections/${section.id}` },
      { label: lesson.title, href: `/materials/lessons/${lesson.id}` },
    ],
  };
}

export async function moduleCrumbs(db: Db, moduleId: string): Promise<CrumbResult | null> {
  const { data: mod } = await db
    .from("material_modules")
    .select("id, title, lesson_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (!mod) return null;
  const { data: lesson } = await db
    .from("material_lessons")
    .select("id, title, section_id")
    .eq("id", mod.lesson_id)
    .maybeSingle();
  if (!lesson) return null;
  const { data: section } = await db
    .from("material_sections")
    .select("id, title, material_id")
    .eq("id", lesson.section_id)
    .maybeSingle();
  if (!section) return null;
  const { data: material } = await db
    .from("materials")
    .select("id, title")
    .eq("id", section.material_id)
    .maybeSingle();
  if (!material) return null;
  return {
    parentId: lesson.id,
    title: mod.title,
    crumbs: [
      MATERIALS_CRUMB,
      { label: material.title, href: `/materials/${material.id}` },
      { label: section.title, href: `/materials/sections/${section.id}` },
      { label: lesson.title, href: `/materials/lessons/${lesson.id}` },
      { label: mod.title, href: `/materials/modules/${mod.id}` },
    ],
  };
}
