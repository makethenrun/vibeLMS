"use client";

import { EntityNavPanel } from "../../_components/entity-nav-panel";
import {
  createModuleAction,
  deleteModuleAction,
  moveModuleAction,
  updateModuleAction,
} from "../../actions";
import type { ModuleRow } from "@/types";

export function ModulesPanel({ lessonId, modules }: { lessonId: string; modules: ModuleRow[] }) {
  return (
    <EntityNavPanel
      items={modules.map((m) => ({ id: m.id, title: m.title, href: `#module-${m.id}` }))}
      createLabel="Новый модуль"
      emptyLabel="Пока нет модулей"
      deleteLabel="Удалить модуль"
      onCreate={(title) => createModuleAction(lessonId, title)}
      onRename={(id, title) => updateModuleAction(id, title)}
      onDelete={(id) => deleteModuleAction(id)}
      onMove={(id, dir) => moveModuleAction(id, dir)}
    />
  );
}
