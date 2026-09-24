"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Home, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/utils/action-result";
import { useOptimisticList, swapItems } from "@/lib/hooks/use-optimistic-list";
import { itemLabel, numberItems } from "@/lib/materials/numbering";
import type { ModuleWithItems, MaterialItemType } from "@/types";
import {
  createModuleAction,
  deleteItemAction,
  deleteModuleAction,
  moveItemAction,
  moveModuleAction,
  updateModuleAction,
} from "../../actions";
import { RowMenu } from "../../_components/row-menu";

const ITEM_LABELS: Record<MaterialItemType, string> = {
  INFO: "Обучающая информация",
  QUIZ: "Тест",
  GAPS: "Заполнить пропуски",
  FREE: "Свободный ответ",
  MATCH: "Сопоставление пар",
  AUDIO: "Аудио",
  VIDEO: "Видео",
  IMAGE: "Изображение",
  CAROUSEL: "Карусель изображений",
  LINK: "Ссылка",
  IMAGE_TASK: "Упражнение с изображениями",
  SENTENCE_TASK: "Работа с предложениями",
  CARDS: "Случайные карточки",
};

interface ModuleTreeProps {
  lessonId: string;
  modules: ModuleWithItems[];
  activeModuleId?: string;
}

export function ModuleTree({ lessonId, modules, activeModuleId }: ModuleTreeProps) {
  const { items, busy, mutate } = useOptimisticList<ModuleWithItems>(modules);
  const [newModule, setNewModule] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function rename(id: string, current: string, action: (title: string) => Promise<ActionResult>) {
    const title = window.prompt("Название модуля:", current);
    if (title === null) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    void mutate(items.map((m) => (m.id === id ? { ...m, title: trimmed } : m)), () => action(trimmed));
  }

  function removeModule(label: string, id: string) {
    if (window.confirm(`Удалить модуль «${label}» со всеми элементами?`)) {
      void mutate(items.filter((m) => m.id !== id), () => deleteModuleAction(id));
    }
  }

  function addModule() {
    const title = newModule.trim();
    if (title.length < 2) return void toast.error("Минимум 2 символа");
    const temp: ModuleWithItems = {
      id: `temp-${Date.now()}`,
      lesson_id: lessonId,
      title,
      position: items.length,
      is_homework: false,
      created_at: new Date().toISOString(),
      items: [],
    };
    // Insert before the homework module so it stays last.
    const homeworkIdx = items.findIndex((m) => m.is_homework);
    const next = [...items];
    if (homeworkIdx >= 0) next.splice(homeworkIdx, 0, temp);
    else next.push(temp);
    setNewModule("");
    void mutate(next, () => createModuleAction(lessonId, title));
  }

  // Modules movable by the tutor (all except the pinned homework module).
  const movableCount = items.filter((m) => !m.is_homework).length;

  return (
    <div className="space-y-4 text-sm">
      {items.length === 0 ? (
        <p className="text-muted-foreground">Пока нет модулей.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((module, mIndex) => {
            const isCollapsed = collapsed[module.id] ?? false;
            const numbers = numberItems(module.items);
            return (
              <li key={module.id} className="space-y-1">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon" variant="ghost" className="h-6 w-6 shrink-0"
                    onClick={() => setCollapsed((p) => ({ ...p, [module.id]: !isCollapsed }))}
                    aria-label={isCollapsed ? "Развернуть" : "Свернуть"}
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Link
                    href={`/materials/lessons/${lessonId}?m=${module.id}`}
                    className={cn(
                      "flex flex-1 items-center gap-1.5 truncate rounded px-2 py-1 font-medium hover:bg-accent",
                      module.id === activeModuleId && "bg-accent",
                    )}
                  >
                    {module.is_homework ? <Home className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                    <span className="truncate">{module.is_homework ? module.title : `${mIndex + 1}. ${module.title}`}</span>
                  </Link>
                  {module.is_homework ? null : (
                    <RowMenu
                      busy={busy}
                      canUp={mIndex > 0}
                      canDown={mIndex < movableCount - 1}
                      deleteLabel="Удалить модуль"
                      onUp={() => mutate(swapItems(items, mIndex, mIndex - 1), () => moveModuleAction(module.id, "up"))}
                      onDown={() => mutate(swapItems(items, mIndex, mIndex + 1), () => moveModuleAction(module.id, "down"))}
                      onRename={() => rename(module.id, module.title, (t) => updateModuleAction(module.id, t))}
                      onDelete={() => removeModule(module.title, module.id)}
                    />
                  )}
                </div>

                {isCollapsed ? null : (
                  <ul className="space-y-0.5 pl-7">
                    {module.items.length === 0 ? (
                      <li className="px-2 py-1 text-xs text-muted-foreground">Нет элементов</li>
                    ) : (
                      module.items.map((item, iIndex) => (
                        <li key={item.id} className="flex items-center gap-1">
                          <Link
                            href={`/materials/lessons/${lessonId}?m=${module.id}#item-${item.id}`}
                            className="flex-1 truncate rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            {(() => { const l = module.is_homework ? null : itemLabel(mIndex + 1, numbers.get(item.id)); return l ? `${l} ` : ""; })()}{item.title || ITEM_LABELS[item.type]}
                          </Link>
                          <RowMenu
                            busy={busy}
                            canUp={iIndex > 0}
                            canDown={iIndex < module.items.length - 1}
                            deleteLabel="Удалить элемент"
                            onUp={() =>
                              mutate(
                                items.map((m) => (m.id === module.id ? { ...m, items: swapItems(m.items, iIndex, iIndex - 1) } : m)),
                                () => moveItemAction(item.id, "up"),
                              )
                            }
                            onDown={() =>
                              mutate(
                                items.map((m) => (m.id === module.id ? { ...m, items: swapItems(m.items, iIndex, iIndex + 1) } : m)),
                                () => moveItemAction(item.id, "down"),
                              )
                            }
                            onDelete={() => {
                              if (window.confirm("Удалить элемент?"))
                                void mutate(
                                  items.map((m) => (m.id === module.id ? { ...m, items: m.items.filter((it) => it.id !== item.id) } : m)),
                                  () => deleteItemAction(item.id),
                                );
                            }}
                          />
                        </li>
                      ))
                    )}
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
          placeholder="Новый модуль"
          value={newModule}
          onChange={(e) => setNewModule(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addModule();
          }}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={busy}
          onClick={addModule} aria-label="Добавить модуль">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
