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

export interface FlatTreeModule {
  id: string;
  title: string;
  lessonId: string;
}

/** Every module across the tree, in reading order (section → lesson → module). */
export function flatModules(tree: TreeSection[]): FlatTreeModule[] {
  const out: FlatTreeModule[] = [];
  for (const section of tree) {
    for (const lesson of section.lessons) {
      for (const mod of lesson.modules) out.push({ id: mod.id, title: mod.title, lessonId: lesson.id });
    }
  }
  return out;
}

/** The module a scope belongs to: the module itself, or the item's module. */
export function moduleIdForScope(tree: TreeSection[], kind: ScopeKind, id: string | null): string | null {
  if (!id) return null;
  if (kind === "module") return id;
  if (kind === "item") {
    for (const section of tree) {
      for (const lesson of section.lessons) {
        for (const mod of lesson.modules) {
          if (mod.items.some((i) => i.id === id)) return mod.id;
        }
      }
    }
  }
  return null;
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
