"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MonitorPlay } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MaterialItemType } from "@/types";
import type { ScopeKind, TreeSection } from "@/lib/materials/scope";

const TYPE_LABELS: Record<MaterialItemType, string> = {
  INFO: "Инфо", QUIZ: "Тест", GAPS: "Пропуски", FREE: "Свободный ответ", MATCH: "Сопоставление",
  AUDIO: "Аудио", VIDEO: "Видео", IMAGE: "Изображение", CAROUSEL: "Карусель", LINK: "Ссылка",
  IMAGE_TASK: "Картинки", SENTENCE_TASK: "Предложения", CARDS: "Карточки",
};

/** The "show to students" icon: filled/primary when this node is what students see now. */
function BroadcastButton({ live, onClick }: { live: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "shrink-0 rounded p-1",
        live ? "text-red-500" : "text-muted-foreground opacity-60 hover:opacity-100 hover:text-foreground",
      )}
      title={live ? "Сейчас видят ученики" : "Показать это ученикам"}
      aria-label="Показать ученикам"
    >
      <MonitorPlay className="h-4 w-4" />
    </button>
  );
}

/** A container row: chevron toggles, label navigates the tutor's own view, the icon broadcasts. */
function GroupRow({
  depth,
  open,
  onToggle,
  label,
  viewing,
  live,
  onNavigate,
  onBroadcast,
  bold,
}: {
  depth: number;
  open: boolean;
  onToggle: () => void;
  label: string;
  viewing: boolean;
  live?: boolean;
  onNavigate: () => void;
  /** Only lessons broadcast to students, so only they get the monitor icon. */
  onBroadcast?: () => void;
  bold?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center gap-1 rounded", viewing ? "bg-accent" : "hover:bg-accent/60", live && "ring-1 ring-red-400")}
      style={{ paddingLeft: depth * 12 }}
    >
      <button type="button" onClick={onToggle} className="shrink-0 p-1" aria-label={open ? "Свернуть" : "Развернуть"}>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      <button type="button" onClick={onNavigate} className={cn("flex-1 truncate py-1 pr-1 text-left", bold && "font-medium")}>
        {label}
      </button>
      {onBroadcast ? <BroadcastButton live={Boolean(live)} onClick={onBroadcast} /> : null}
    </div>
  );
}

/**
 * Section → Lesson → Module → Item tree for the live console. The label
 * navigates only the tutor's own view (scrolls the lesson); the monitor icon
 * broadcasts that node to the students.
 */
export function ExerciseTree({
  tree,
  viewKind,
  viewId,
  liveKind,
  liveId,
  onNavigate,
  onBroadcast,
}: {
  tree: TreeSection[];
  viewKind: ScopeKind;
  viewId: string | null;
  liveKind: ScopeKind;
  liveId: string | null;
  onNavigate: (kind: ScopeKind, id: string) => void;
  onBroadcast: (kind: ScopeKind, id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  const isOpen = (id: string) => !collapsed[id];
  const isViewing = (kind: ScopeKind, id: string) => viewKind === kind && viewId === id;
  const isLive = (kind: ScopeKind, id: string) => liveKind === kind && liveId === id;

  if (tree.length === 0) return <p className="px-2 text-xs text-muted-foreground">В материале нет упражнений.</p>;

  return (
    <div className="space-y-0.5 text-sm">
      {tree.map((section) => (
        <div key={section.id}>
          <GroupRow
            depth={0} bold open={isOpen(section.id)} onToggle={() => toggle(section.id)}
            label={section.title} viewing={isViewing("section", section.id)}
            onNavigate={() => onNavigate("section", section.id)}
          />
          {isOpen(section.id)
            ? section.lessons.map((lesson) => (
                <div key={lesson.id}>
                  <GroupRow
                    depth={1} open={isOpen(lesson.id)} onToggle={() => toggle(lesson.id)}
                    label={lesson.title} viewing={isViewing("lesson", lesson.id)} live={isLive("lesson", lesson.id)}
                    onNavigate={() => onNavigate("lesson", lesson.id)} onBroadcast={() => onBroadcast("lesson", lesson.id)}
                  />
                  {isOpen(lesson.id)
                    ? lesson.modules.map((mod) => (
                        <div key={mod.id}>
                          <GroupRow
                            depth={2} open={isOpen(mod.id)} onToggle={() => toggle(mod.id)}
                            label={mod.title} viewing={isViewing("module", mod.id)}
                            onNavigate={() => onNavigate("module", mod.id)}
                          />
                          {isOpen(mod.id)
                            ? mod.items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => onNavigate("item", item.id)}
                                  className={cn(
                                    "block w-full truncate rounded py-1 pr-1 text-left hover:bg-accent",
                                    isViewing("item", item.id) && "bg-accent",
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
