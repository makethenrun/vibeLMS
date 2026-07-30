"use client";

import { ChildList } from "../../_components/child-list";
import {
  createModuleAction,
  deleteModuleAction,
  moveModuleAction,
  updateModuleAction,
} from "../../actions";
import type { ModuleRow } from "@/types";

export function ModuleList({ lessonId, modules }: { lessonId: string; modules: ModuleRow[] }) {
  return (
    <ChildList
      items={modules.map((m) => ({ id: m.id, title: m.title, href: `/materials/modules/${m.id}` }))}
      createLabel="Добавить модуль"
      emptyLabel="Пока нет модулей"
      onCreate={(title) => createModuleAction(lessonId, title)}
      onRename={(id, title) => updateModuleAction(id, title)}
      onDelete={(id) => deleteModuleAction(id)}
      onMove={(id, dir) => moveModuleAction(id, dir)}
    />
  );
}
