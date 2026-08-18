"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MaterialItemType } from "@/types";
import type { ScopeKind, TreeSection } from "@/lib/materials/scope";

const TYPE_LABELS: Record<MaterialItemType, string> = {
  INFO: "Инфо", QUIZ: "Тест", GAPS: "Пропуски", FREE: "Свободный ответ", MATCH: "Сопоставление",
  AUDIO: "Аудио", VIDEO: "Видео", IMAGE: "Изображение", CAROUSEL: "Карусель", LINK: "Ссылка",
  IMAGE_TASK: "Картинки", SENTENCE_TASK: "Предложения",
};

/** A container row: chevron toggles expand, the label selects the whole scope. */
function GroupRow({
  depth,
  open,
  onToggle,
  label,
  active,
  onSelect,
  bold,
}: {
  depth: number;
  open: boolean;
  onToggle: () => void;
  label: string;
  active: boolean;
  onSelect: () => void;
  bold?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center gap-1 rounded", active ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
      style={{ paddingLeft: depth * 12 }}
    >
      <button type="button" onClick={onToggle} className="shrink-0 p-1" aria-label={open ? "Свернуть" : "Развернуть"}>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      <button type="button" onClick={onSelect} className={cn("flex-1 truncate py-1 pr-1 text-left", bold && "font-medium")}>
        {label}
      </button>
    </div>
  );
}

/** Section → Lesson → Module → Item tree. Selecting any node makes it active. */
export function ExerciseTree({
  tree,
  activeKind,
  activeId,
  onSelect,
}: {
  tree: TreeSection[];
  activeKind: ScopeKind;
  activeId: string | null;
  onSelect: (kind: ScopeKind, id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  const isOpen = (id: string) => !collapsed[id];
  const isActive = (kind: ScopeKind, id: string) => activeKind === kind && activeId === id;

  if (tree.length === 0) return <p className="px-2 text-xs text-muted-foreground">В материале нет упражнений.</p>;

  return (
    <div className="space-y-0.5 text-sm">
      {tree.map((section) => (
        <div key={section.id}>
          <GroupRow
            depth={0} bold open={isOpen(section.id)} onToggle={() => toggle(section.id)}
            label={section.title} active={isActive("section", section.id)} onSelect={() => onSelect("section", section.id)}
          />
          {isOpen(section.id)
            ? section.lessons.map((lesson) => (
                <div key={lesson.id}>
                  <GroupRow
                    depth={1} open={isOpen(lesson.id)} onToggle={() => toggle(lesson.id)}
                    label={lesson.title} active={isActive("lesson", lesson.id)} onSelect={() => onSelect("lesson", lesson.id)}
                  />
                  {isOpen(lesson.id)
                    ? lesson.modules.map((mod) => (
                        <div key={mod.id}>
                          <GroupRow
                            depth={2} open={isOpen(mod.id)} onToggle={() => toggle(mod.id)}
                            label={mod.title} active={isActive("module", mod.id)} onSelect={() => onSelect("module", mod.id)}
                          />
                          {isOpen(mod.id)
                            ? mod.items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => onSelect("item", item.id)}
                                  className={cn(
                                    "block w-full truncate rounded py-1 pr-1 text-left hover:bg-accent",
                                    isActive("item", item.id) && "bg-primary text-primary-foreground hover:bg-primary",
                                  )}
                                  style={{ paddingLeft: 3 * 12 + 20 }}
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
