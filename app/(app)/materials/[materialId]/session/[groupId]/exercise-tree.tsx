"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MaterialItemType } from "@/types";
import type { TreeSection } from "@/services/materials/material-tree.service";

const TYPE_LABELS: Record<MaterialItemType, string> = {
  INFO: "Инфо", QUIZ: "Тест", GAPS: "Пропуски", FREE: "Свободный ответ", MATCH: "Сопоставление",
  AUDIO: "Аудио", VIDEO: "Видео", IMAGE: "Изображение", CAROUSEL: "Карусель", LINK: "Ссылка",
  IMAGE_TASK: "Картинки", SENTENCE_TASK: "Предложения",
};

function Row({ depth, open, onToggle, label }: { depth: number; open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-1 rounded px-1 py-1 text-left hover:bg-accent"
      style={{ paddingLeft: depth * 12 + 4 }}
    >
      {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Section → Lesson → Module → Item tree; clicking an item makes it active. */
export function ExerciseTree({
  tree,
  activeItemId,
  onSelect,
}: {
  tree: TreeSection[];
  activeItemId: string | null;
  onSelect: (itemId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  const isOpen = (id: string) => !collapsed[id];

  if (tree.length === 0) return <p className="px-2 text-xs text-muted-foreground">В материале нет упражнений.</p>;

  return (
    <div className="space-y-0.5 text-sm">
      {tree.map((section) => (
        <div key={section.id}>
          <Row depth={0} open={isOpen(section.id)} onToggle={() => toggle(section.id)} label={section.title} />
          {isOpen(section.id)
            ? section.lessons.map((lesson) => (
                <div key={lesson.id}>
                  <Row depth={1} open={isOpen(lesson.id)} onToggle={() => toggle(lesson.id)} label={lesson.title} />
                  {isOpen(lesson.id)
                    ? lesson.modules.map((module) => (
                        <div key={module.id}>
                          <Row depth={2} open={isOpen(module.id)} onToggle={() => toggle(module.id)} label={module.title} />
                          {isOpen(module.id)
                            ? module.items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => onSelect(item.id)}
                                  className={cn(
                                    "block w-full truncate rounded py-1 pr-1 text-left hover:bg-accent",
                                    item.id === activeItemId && "bg-primary text-primary-foreground hover:bg-primary",
                                  )}
                                  style={{ paddingLeft: 3 * 12 + 18 }}
                                >
                                  {item.title || TYPE_LABELS[item.type]}
                                </button>
                              ))
                            : null}
                        </div>
                      ))
                    : null}
                </div>
              ))
            : null}
        </div>
      ))}
    </div>
  );
}
