"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/utils/action-result";
import type { SectionWithLessons } from "@/types";
import {
  createLessonAction,
  createSectionAction,
  deleteLessonAction,
  deleteSectionAction,
  moveLessonAction,
  moveSectionAction,
  updateLessonAction,
  updateSectionAction,
} from "../actions";
import { RowMenu } from "../_components/row-menu";

interface SectionTreeProps {
  materialId: string;
  sections: SectionWithLessons[];
  activeLessonId?: string;
}

export function SectionTree({ materialId, sections, activeLessonId }: SectionTreeProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [newSection, setNewSection] = useState("");
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  async function run(action: () => Promise<ActionResult>) {
    setBusy(true);
    try {
      const result = await action();
      if (result.success) {
        router.refresh();
        return true;
      }
      toast.error(result.error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function rename(current: string, action: (title: string) => Promise<ActionResult>) {
    const title = window.prompt("Название:", current);
    if (title === null) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    void run(() => action(trimmed));
  }

  function remove(label: string, action: () => Promise<ActionResult>) {
    if (window.confirm(`Удалить «${label}» со всем содержимым?`)) void run(action);
  }

  async function addSection() {
    const title = newSection.trim();
    if (title.length < 2) return toast.error("Минимум 2 символа");
    if (await run(() => createSectionAction(materialId, title))) setNewSection("");
  }

  async function addLesson(sectionId: string) {
    const title = (lessonDrafts[sectionId] ?? "").trim();
    if (title.length < 2) return toast.error("Минимум 2 символа");
    if (await run(() => createLessonAction(sectionId, title))) {
      setLessonDrafts((prev) => ({ ...prev, [sectionId]: "" }));
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {sections.length === 0 ? (
        <p className="text-muted-foreground">Пока нет разделов.</p>
      ) : (
        <ul className="space-y-3">
          {sections.map((section, sIndex) => {
            const isCollapsed = collapsed[section.id] ?? false;
            return (
              <li key={section.id} className="space-y-1">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon" variant="ghost" className="h-6 w-6 shrink-0"
                    onClick={() => setCollapsed((p) => ({ ...p, [section.id]: !isCollapsed }))}
                    aria-label={isCollapsed ? "Развернуть" : "Свернуть"}
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <span className="flex-1 truncate font-medium">{section.title}</span>
                  <RowMenu
                    busy={busy}
                    canUp={sIndex > 0}
                    canDown={sIndex < sections.length - 1}
                    deleteLabel="Удалить раздел"
                    onUp={() => run(() => moveSectionAction(section.id, "up"))}
                    onDown={() => run(() => moveSectionAction(section.id, "down"))}
                    onRename={() => rename(section.title, (t) => updateSectionAction(section.id, t))}
                    onDelete={() => remove(section.title, () => deleteSectionAction(section.id))}
                  />
                </div>

                {isCollapsed ? null : (
                  <ul className="space-y-0.5 pl-7">
                    {section.lessons.map((lesson, lIndex) => (
                      <li key={lesson.id} className="flex items-center gap-1">
                        <Link
                          href={`/materials/lessons/${lesson.id}`}
                          className={cn(
                            "flex-1 truncate rounded px-2 py-1 hover:bg-accent",
                            lesson.id === activeLessonId && "bg-accent font-medium",
                          )}
                        >
                          {lesson.title}
                        </Link>
                        <RowMenu
                          busy={busy}
                          canUp={lIndex > 0}
                          canDown={lIndex < section.lessons.length - 1}
                          deleteLabel="Удалить урок"
                          onUp={() => run(() => moveLessonAction(lesson.id, "up"))}
                          onDown={() => run(() => moveLessonAction(lesson.id, "down"))}
                          onRename={() => rename(lesson.title, (t) => updateLessonAction(lesson.id, t))}
                          onDelete={() => remove(lesson.title, () => deleteLessonAction(lesson.id))}
                        />
                      </li>
                    ))}
                    <li className="flex items-center gap-1 pt-1">
                      <Input
                        className="h-7"
                        placeholder="Новый урок"
                        value={lessonDrafts[section.id] ?? ""}
                        onChange={(e) => setLessonDrafts((p) => ({ ...p, [section.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void addLesson(section.id);
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy}
                        onClick={() => addLesson(section.id)} aria-label="Добавить урок">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </li>
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-1 border-t pt-3">
        <Input
          className="h-8"
          placeholder="Новый раздел"
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addSection();
          }}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={busy}
          onClick={addSection} aria-label="Добавить раздел">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
