"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
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

interface MaterialTreeProps {
  materialId: string;
  activeLessonId?: string;
  tree: SectionWithLessons[];
}

export function MaterialTree({ materialId, activeLessonId, tree }: MaterialTreeProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [newSection, setNewSection] = useState("");
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, string>>({});

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

  async function rename(current: string, action: (title: string) => Promise<ActionResult>) {
    const title = window.prompt("Название:", current);
    if (title === null) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    await run(() => action(trimmed));
  }

  async function addSection() {
    const title = newSection.trim();
    if (title.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    const okDone = await run(() => createSectionAction(materialId, title));
    if (okDone) setNewSection("");
  }

  async function addLesson(sectionId: string) {
    const title = (lessonDrafts[sectionId] ?? "").trim();
    if (title.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    const okDone = await run(() => createLessonAction(sectionId, title));
    if (okDone) setLessonDrafts((prev) => ({ ...prev, [sectionId]: "" }));
  }

  return (
    <div className="space-y-4 text-sm">
      {tree.length === 0 ? (
        <p className="text-muted-foreground">Пока нет разделов.</p>
      ) : (
        <ul className="space-y-4">
          {tree.map((section, sIndex) => (
            <li key={section.id} className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="flex-1 truncate font-medium">{section.title}</span>
                <Button
                  size="icon" variant="ghost" className="h-6 w-6"
                  disabled={busy || sIndex === 0}
                  onClick={() => run(() => moveSectionAction(section.id, "up"))}
                  aria-label="Раздел вверх"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-6 w-6"
                  disabled={busy || sIndex === tree.length - 1}
                  onClick={() => run(() => moveSectionAction(section.id, "down"))}
                  aria-label="Раздел вниз"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-6 w-6"
                  onClick={() => rename(section.title, (t) => updateSectionAction(section.id, t))}
                  aria-label="Переименовать раздел"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Удалить раздел «${section.title}» со всеми уроками?`)) {
                      void run(() => deleteSectionAction(section.id));
                    }
                  }}
                  aria-label="Удалить раздел"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <ul className="space-y-0.5 pl-3">
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
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6"
                      disabled={busy || lIndex === 0}
                      onClick={() => run(() => moveLessonAction(lesson.id, "up"))}
                      aria-label="Урок вверх"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6"
                      disabled={busy || lIndex === section.lessons.length - 1}
                      onClick={() => run(() => moveLessonAction(lesson.id, "down"))}
                      aria-label="Урок вниз"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6"
                      onClick={() => rename(lesson.title, (t) => updateLessonAction(lesson.id, t))}
                      aria-label="Переименовать урок"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Удалить урок «${lesson.title}»?`)) {
                          void run(() => deleteLessonAction(lesson.id));
                        }
                      }}
                      aria-label="Удалить урок"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}

                <li className="flex items-center gap-1 pt-1">
                  <Input
                    className="h-7"
                    placeholder="Новый урок"
                    value={lessonDrafts[section.id] ?? ""}
                    onChange={(e) =>
                      setLessonDrafts((prev) => ({ ...prev, [section.id]: e.target.value }))
                    }
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
            </li>
          ))}
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
