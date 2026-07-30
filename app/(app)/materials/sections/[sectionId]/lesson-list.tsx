"use client";

import { ChildList } from "../../_components/child-list";
import {
  createLessonAction,
  deleteLessonAction,
  moveLessonAction,
  updateLessonAction,
} from "../../actions";
import type { LessonRow } from "@/types";

export function LessonList({ sectionId, lessons }: { sectionId: string; lessons: LessonRow[] }) {
  return (
    <ChildList
      items={lessons.map((l) => ({ id: l.id, title: l.title, href: `/materials/lessons/${l.id}` }))}
      createLabel="Добавить урок"
      emptyLabel="Пока нет уроков"
      onCreate={(title) => createLessonAction(sectionId, title)}
      onRename={(id, title) => updateLessonAction(id, title)}
      onDelete={(id) => deleteLessonAction(id)}
      onMove={(id, dir) => moveLessonAction(id, dir)}
    />
  );
}
