"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Group, ModuleWithItems } from "@/types";
import { AddItemMenu } from "./add-item-menu";
import { ImportDialog } from "./import-dialog";
import { ItemCard } from "./item-card";

interface ModulePaneProps {
  module: ModuleWithItems;
  availableGroups: Group[];
  pins: Record<string, string[]>;
  onBackground?: boolean;
}

export function ModulePane({ module, availableGroups, pins, onBackground = false }: ModulePaneProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section id={`module-${module.id}`} className="scroll-mt-20 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={onBackground ? "inline-block rounded-md bg-card/95 px-3 py-1 text-lg font-semibold shadow-sm" : "text-lg font-semibold"}>{module.title}</h3>
        {selected.size > 0 ? (
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Импортировать выбранные ({selected.size})
          </Button>
        ) : null}
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
              availableGroups={availableGroups}
              pinnedGroupIds={pins[item.id] ?? []}
              selected={selected.has(item.id)}
              onToggleSelect={() => toggle(item.id)}
            />
          ))}
        </div>
      )}

      <AddItemMenu moduleId={module.id} />

      <ImportDialog
        itemIds={[...selected]}
        open={importOpen}
        onOpenChange={setImportOpen}
        onDone={() => setSelected(new Set())}
      />
    </section>
  );
}
