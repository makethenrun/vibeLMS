"use client";

import { EntityNavPanel } from "../../_components/entity-nav-panel";
import {
  createLessonAction,
  deleteLessonAction,
  moveLessonAction,
  updateLessonAction,
} from "../../actions";
import type { LessonRow } from "@/types";

export function LessonsPanel({ sectionId, lessons }: { sectionId: string; lessons: LessonRow[] }) {
  return (
    <EntityNavPanel
      items={lessons.map((l) => ({ id: l.id, title: l.title, href: `/materials/lessons/${l.id}` }))}
      createLabel="Новый урок"
      emptyLabel="Пока нет уроков"
      deleteLabel="Удалить урок"
      onCreate={(title) => createLessonAction(sectionId, title)}
      onRename={(id, title) => updateLessonAction(id, title)}
      onDelete={(id) => deleteLessonAction(id)}
      onMove={(id, dir) => moveLessonAction(id, dir)}
    />
  );
}
