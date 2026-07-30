"use client";

import { ChildList } from "../_components/child-list";
import {
  createSectionAction,
  deleteSectionAction,
  moveSectionAction,
  updateSectionAction,
} from "../actions";
import type { SectionRow } from "@/types";

export function SectionList({ materialId, sections }: { materialId: string; sections: SectionRow[] }) {
  return (
    <ChildList
      items={sections.map((s) => ({ id: s.id, title: s.title, href: `/materials/sections/${s.id}` }))}
      createLabel="Добавить раздел"
      emptyLabel="Пока нет разделов"
      onCreate={(title) => createSectionAction(materialId, title)}
      onRename={(id, title) => updateSectionAction(id, title)}
      onDelete={(id) => deleteSectionAction(id)}
      onMove={(id, dir) => moveSectionAction(id, dir)}
    />
  );
}
