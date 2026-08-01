"use client";

import { EntityNavPanel } from "../_components/entity-nav-panel";
import {
  createSectionAction,
  deleteSectionAction,
  moveSectionAction,
  updateSectionAction,
} from "../actions";
import type { SectionRow } from "@/types";

export function SectionsPanel({ materialId, sections }: { materialId: string; sections: SectionRow[] }) {
  return (
    <EntityNavPanel
      items={sections.map((s) => ({ id: s.id, title: s.title, href: `/materials/sections/${s.id}` }))}
      createLabel="Новый раздел"
      emptyLabel="Пока нет разделов"
      deleteLabel="Удалить раздел"
      onCreate={(title) => createSectionAction(materialId, title)}
      onRename={(id, title) => updateSectionAction(id, title)}
      onDelete={(id) => deleteSectionAction(id)}
      onMove={(id, dir) => moveSectionAction(id, dir)}
    />
  );
}
