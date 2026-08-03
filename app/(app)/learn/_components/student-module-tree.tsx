"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MaterialItemType, ModuleWithItems } from "@/types";

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
};

export function StudentModuleTree({
  lessonHref,
  modules,
  activeModuleId,
}: {
  lessonHref: string;
  modules: ModuleWithItems[];
  activeModuleId?: string;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (modules.length === 0) return <p className="text-sm text-muted-foreground">Пока нет модулей.</p>;

  return (
    <ul className="space-y-2 text-sm">
      {modules.map((module) => {
        const isCollapsed = collapsed[module.id] ?? false;
        return (
          <li key={module.id} className="space-y-1">
            <div className="flex items-center gap-1">
              <Button
                size="icon" variant="ghost" className="h-6 w-6 shrink-0"
                onClick={() => setCollapsed((p) => ({ ...p, [module.id]: !isCollapsed }))}
                aria-label={isCollapsed ? "Развернуть" : "Свернуть"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Link
                href={`${lessonHref}?m=${module.id}`}
                className={cn("flex-1 truncate rounded px-2 py-1 font-medium hover:bg-accent", module.id === activeModuleId && "bg-accent")}
              >
                {module.title}
              </Link>
            </div>
            {isCollapsed ? null : (
              <ul className="space-y-0.5 pl-7">
                {module.items.length === 0 ? (
                  <li className="px-2 py-1 text-xs text-muted-foreground">Нет элементов</li>
                ) : (
                  module.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`${lessonHref}?m=${module.id}#item-${item.id}`}
                        className="block truncate rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        {item.title || ITEM_LABELS[item.type]}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
