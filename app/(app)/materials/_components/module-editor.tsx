"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/utils/action-result";
import type { ModuleWithItems } from "@/types";
import {
  deleteModuleAction,
  moveModuleAction,
  updateModuleAction,
} from "../actions";
import { AddItemMenu } from "./add-item-menu";
import { ItemCard } from "./item-card";
import { RowMenu } from "./row-menu";

interface ModuleEditorProps {
  module: ModuleWithItems;
  canUp: boolean;
  canDown: boolean;
}

export function ModuleEditor({ module, canUp, canDown }: ModuleEditorProps) {
  const router = useRouter();

  async function run(action: () => Promise<ActionResult>) {
    const result = await action();
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  function rename() {
    const title = window.prompt("Название модуля:", module.title);
    if (title === null) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    void run(() => updateModuleAction(module.id, trimmed));
  }

  function remove() {
    if (window.confirm(`Удалить модуль «${module.title}» со всеми элементами?`)) {
      void run(() => deleteModuleAction(module.id));
    }
  }

  return (
    <section id={`module-${module.id}`} className="scroll-mt-20 space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{module.title}</h3>
        <RowMenu
          canUp={canUp}
          canDown={canDown}
          deleteLabel="Удалить модуль"
          onUp={() => run(() => moveModuleAction(module.id, "up"))}
          onDown={() => run(() => moveModuleAction(module.id, "down"))}
          onRename={rename}
          onDelete={remove}
        />
      </div>

      {module.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">В модуле пока нет элементов.</p>
      ) : (
        <div className="space-y-3">
          {module.items.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              canUp={index > 0}
              canDown={index < module.items.length - 1}
            />
          ))}
        </div>
      )}

      <AddItemMenu moduleId={module.id} />
    </section>
  );
}
