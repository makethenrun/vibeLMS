import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { ItemRow, ModuleWithItems } from "@/types";
import { listModules } from "./modules.service";

/**
 * Returns the lesson's modules (ordered), each with its ordered items — the
 * left-hand editing surface of the lesson workspace.
 */
export async function getLessonModules(db: Db, lessonId: string): Promise<ModuleWithItems[]> {
  const modules = await listModules(db, lessonId);
  if (modules.length === 0) return [];

  const { data: items, error } = await db
    .from("material_items")
    .select("*")
    .in(
      "module_id",
      modules.map((m) => m.id),
    )
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  const byModule = new Map<string, ItemRow[]>();
  for (const item of items ?? []) {
    const arr = byModule.get(item.module_id) ?? [];
    arr.push(item);
    byModule.set(item.module_id, arr);
  }

  return modules.map((module) => ({ ...module, items: byModule.get(module.id) ?? [] }));
}
