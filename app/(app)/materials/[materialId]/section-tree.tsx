"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/utils/action-result";
import type { LessonRow, SectionWithLessons } from "@/types";
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

function tempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function SectionTree({ materialId, sections, activeLessonId }: SectionTreeProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [newSection, setNewSection] = useState("");
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Optimistic mirror of the server data: edits show instantly, then the
  // background refresh replaces this with the authoritative server state.
  const [items, setItems] = useState<SectionWithLessons[]>(sections);
  useEffect(() => setItems(sections), [sections]);

  /**
   * Apply an optimistic state change immediately, run the server action in the
   * background, and roll back to the snapshot if it fails.
   */
  async function optimistic(next: SectionWithLessons[], action: () => Promise<ActionResult>) {
    const snapshot = items;
    setItems(next);
    setBusy(true);
    try {
      const result = await action();
      if (result.success) {
        router.refresh();
        return true;
      }
      setItems(snapshot);
      toast.error(result.error);
      return false;
    } catch {
      setItems(snapshot);
      toast.error("Не удалось сохранить");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function rename(current: string, action: (title: string) => Promise<ActionResult>, apply: (title: string) => void) {
    const title = window.prompt("Название:", current);
    if (title === null) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    apply(trimmed);
    void bareRun(() => action(trimmed));
  }

  /** Run an action whose optimistic change was already applied by the caller. */
  async function bareRun(action: () => Promise<ActionResult>) {
    setBusy(true);
    try {
      const result = await action();
      if (result.success) router.refresh();
      else {
        toast.error(result.error);
        router.refresh(); // pull back the true state after a failed optimistic edit
      }
    } finally {
      setBusy(false);
    }
  }

  function remove(label: string, next: SectionWithLessons[], action: () => Promise<ActionResult>) {
    if (window.confirm(`Удалить «${label}» со всем содержимым?`)) void optimistic(next, action);
  }

  function addSection() {
    const title = newSection.trim();
    if (title.length < 2) return void toast.error("Минимум 2 символа");
    const temp: SectionWithLessons = {
      id: tempId(),
      material_id: materialId,
      title,
      position: 0,
      is_homework: false,
      created_at: new Date().toISOString(),
      lessons: [],
    };
    // Insert before the homework section so it stays last.
    const homeworkIdx = items.findIndex((s) => s.is_homework);
    const next = [...items];
    if (homeworkIdx >= 0) next.splice(homeworkIdx, 0, temp);
    else next.push(temp);
    setNewSection("");
    void optimistic(next, () => createSectionAction(materialId, title));
  }

  function addLesson(sectionId: string) {
    const title = (lessonDrafts[sectionId] ?? "").trim();
    if (title.length < 2) return void toast.error("Минимум 2 символа");
    const lesson = {
      id: tempId(),
      section_id: sectionId,
      title,
      position: 0,
      background_url: null,
      background_dim: 0,
      background_fit: "cover",
      background_position: "center",
      background_scale: 1,
      created_at: new Date().toISOString(),
    } as LessonRow;
    const next = items.map((s) => (s.id === sectionId ? { ...s, lessons: [...s.lessons, lesson] } : s));
    setLessonDrafts((prev) => ({ ...prev, [sectionId]: "" }));
    void optimistic(next, () => createLessonAction(sectionId, title));
  }

  function swap<T>(arr: T[], i: number, j: number): T[] {
    const copy = [...arr];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }

  return (
    <div className="space-y-4 text-sm">
      {items.length === 0 ? (
        <p className="text-muted-foreground">Пока нет разделов.</p>
      ) : (
        <ul className="space-y-3">
          {(() => {
            // The homework section is always pinned last and can't be moved past.
            const movableCount = items.filter((s) => !s.is_homework).length;
            return items.map((section, sIndex) => {
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
                    {section.is_homework ? null : (
                      <RowMenu
                        busy={busy}
                        canUp={sIndex > 0}
                        canDown={sIndex < movableCount - 1}
                        deleteLabel="Удалить раздел"
                        onUp={() => optimistic(swap(items, sIndex, sIndex - 1), () => moveSectionAction(section.id, "up"))}
                        onDown={() => optimistic(swap(items, sIndex, sIndex + 1), () => moveSectionAction(section.id, "down"))}
                        onRename={() =>
                          rename(section.title, (t) => updateSectionAction(section.id, t), (t) =>
                            setItems((cur) => cur.map((s) => (s.id === section.id ? { ...s, title: t } : s))),
                          )
                        }
                        onDelete={() => remove(section.title, items.filter((s) => s.id !== section.id), () => deleteSectionAction(section.id))}
                      />
                    )}
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
                            onUp={() =>
                              optimistic(
                                items.map((s) => (s.id === section.id ? { ...s, lessons: swap(s.lessons, lIndex, lIndex - 1) } : s)),
                                () => moveLessonAction(lesson.id, "up"),
                              )
                            }
                            onDown={() =>
                              optimistic(
                                items.map((s) => (s.id === section.id ? { ...s, lessons: swap(s.lessons, lIndex, lIndex + 1) } : s)),
                                () => moveLessonAction(lesson.id, "down"),
                              )
                            }
                            onRename={() =>
                              rename(lesson.title, (t) => updateLessonAction(lesson.id, t), (t) =>
                                setItems((cur) =>
                                  cur.map((s) =>
                                    s.id === section.id
                                      ? { ...s, lessons: s.lessons.map((l) => (l.id === lesson.id ? { ...l, title: t } : l)) }
                                      : s,
                                  ),
                                ),
                              )
                            }
                            onDelete={() =>
                              remove(
                                lesson.title,
                                items.map((s) => (s.id === section.id ? { ...s, lessons: s.lessons.filter((l) => l.id !== lesson.id) } : s)),
                                () => deleteLessonAction(lesson.id),
                              )
                            }
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
                            if (e.key === "Enter") addLesson(section.id);
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => addLesson(section.id)} aria-label="Добавить урок">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </li>
                    </ul>
                  )}
                </li>
              );
            });
          })()}
        </ul>
      )}

      <div className="flex items-center gap-1 border-t pt-3">
        <Input
          className="h-8"
          placeholder="Новый раздел"
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addSection();
          }}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8"
          onClick={addSection} aria-label="Добавить раздел">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
