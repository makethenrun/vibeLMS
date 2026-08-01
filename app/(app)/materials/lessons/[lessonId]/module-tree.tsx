"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/utils/action-result";
import type { MaterialItemType, ModuleWithItems } from "@/types";
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
  AUDIO: "Аудирование",
};

export function ModuleTree({ lessonId, modules }: { lessonId: string; modules: ModuleWithItems[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [newModule, setNewModule] = useState("");
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
    const title = window.prompt("Название модуля:", current);
    if (title === null) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    void run(() => action(trimmed));
  }

  function removeModule(label: string, id: string) {
    if (window.confirm(`Удалить модуль «${label}» со всеми элементами?`)) {
      void run(() => deleteModuleAction(id));
    }
  }

  async function addModule() {
    const title = newModule.trim();
    if (title.length < 2) return toast.error("Минимум 2 символа");
    if (await run(() => createModuleAction(lessonId, title))) setNewModule("");
  }

  return (
    <div className="space-y-4 text-sm">
      {modules.length === 0 ? (
        <p className="text-muted-foreground">Пока нет модулей.</p>
      ) : (
        <ul className="space-y-3">
          {modules.map((module, mIndex) => {
            const isCollapsed = collapsed[module.id] ?? false;
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
                  <Link href={`#module-${module.id}`} className="flex-1 truncate rounded px-2 py-1 font-medium hover:bg-accent">
                    {module.title}
                  </Link>
                  <RowMenu
                    busy={busy}
                    canUp={mIndex > 0}
                    canDown={mIndex < modules.length - 1}
                    deleteLabel="Удалить модуль"
                    onUp={() => run(() => moveModuleAction(module.id, "up"))}
                    onDown={() => run(() => moveModuleAction(module.id, "down"))}
                    onRename={() => rename(module.title, (t) => updateModuleAction(module.id, t))}
                    onDelete={() => removeModule(module.title, module.id)}
                  />
                </div>

                {isCollapsed ? null : (
                  <ul className="space-y-0.5 pl-7">
                    {module.items.length === 0 ? (
                      <li className="px-2 py-1 text-xs text-muted-foreground">Нет элементов</li>
                    ) : (
                      module.items.map((item, iIndex) => (
                        <li key={item.id} className="flex items-center gap-1">
                          <Link
                            href={`#item-${item.id}`}
                            className="flex-1 truncate rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            {ITEM_LABELS[item.type]}
                          </Link>
                          <RowMenu
                            busy={busy}
                            canUp={iIndex > 0}
                            canDown={iIndex < module.items.length - 1}
                            deleteLabel="Удалить элемент"
                            onUp={() => run(() => moveItemAction(item.id, "up"))}
                            onDown={() => run(() => moveItemAction(item.id, "down"))}
                            onDelete={() => {
                              if (window.confirm("Удалить элемент?")) void run(() => deleteItemAction(item.id));
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
