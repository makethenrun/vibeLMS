import type { MaterialItemType } from "@/types";

// Shared material-tree node shapes and the "active scope" model used by live
// sessions. Pure (no server imports) so both server and client can use it.

export type ScopeKind = "item" | "module" | "lesson" | "section";

export interface TreeItem {
  id: string;
  title: string | null;
  type: MaterialItemType;
}
export interface TreeModule {
  id: string;
  title: string;
  items: TreeItem[];
}
export interface TreeLesson {
  id: string;
  title: string;
  modules: TreeModule[];
}
export interface TreeSection {
  id: string;
  title: string;
  lessons: TreeLesson[];
}

/** Ordered item ids covered by a scope (item / module / lesson / whole section). */
export function itemsForScope(tree: TreeSection[], kind: ScopeKind, id: string | null): string[] {
  if (!id) return [];
  if (kind === "item") return [id];
  for (const section of tree) {
    if (kind === "section" && section.id === id) {
      return section.lessons.flatMap((l) => l.modules.flatMap((m) => m.items.map((i) => i.id)));
    }
    for (const lesson of section.lessons) {
      if (kind === "lesson" && lesson.id === id) {
        return lesson.modules.flatMap((m) => m.items.map((i) => i.id));
      }
      for (const mod of lesson.modules) {
        if (kind === "module" && mod.id === id) {
          return mod.items.map((i) => i.id);
        }
      }
    }
  }
  return [];
}
