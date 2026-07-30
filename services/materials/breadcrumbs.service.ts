import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { Breadcrumb } from "@/types";

export interface LessonContext {
  crumbs: Breadcrumb[];
  materialId: string;
  sectionId: string;
  title: string;
}

const MATERIALS_CRUMB: Breadcrumb = { label: "Материалы", href: "/materials" };

/**
 * Walks material → section → lesson for the lesson workspace: breadcrumb chain,
 * the owning material id (for the tree panel) and the lesson title.
 */
export async function lessonContext(db: Db, lessonId: string): Promise<LessonContext | null> {
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
    materialId: material.id,
    sectionId: section.id,
    title: lesson.title,
    crumbs: [
      MATERIALS_CRUMB,
      { label: material.title, href: `/materials/${material.id}` },
      { label: section.title, href: `/materials/${material.id}` },
      { label: lesson.title, href: `/materials/lessons/${lesson.id}` },
    ],
  };
}
