"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/utils/action-result";
import { RowMenu } from "./row-menu";

export interface NavEntity {
  id: string;
  title: string;
  href: string;
}

interface EntityNavPanelProps {
  items: NavEntity[];
  createLabel: string;
  emptyLabel: string;
  deleteLabel: string;
  activeId?: string;
  onCreate: (title: string) => Promise<ActionResult>;
  onRename: (id: string, title: string) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  onMove: (id: string, direction: "up" | "down") => Promise<ActionResult>;
}

export function EntityNavPanel({
  items,
  createLabel,
  emptyLabel,
  deleteLabel,
  activeId,
  onCreate,
  onRename,
  onDelete,
  onMove,
}: EntityNavPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");

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

  async function add() {
    const title = draft.trim();
    if (title.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    const okDone = await run(() => onCreate(title));
    if (okDone) setDraft("");
  }

  function rename(id: string, current: string) {
    const title = window.prompt("Название:", current);
    if (title === null) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    void run(() => onRename(id, trimmed));
  }

  function remove(id: string, title: string) {
    if (window.confirm(`Удалить «${title}» со всем содержимым?`)) void run(() => onDelete(id));
  }

  return (
    <div className="space-y-3 text-sm">
      {items.length === 0 ? (
        <p className="text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-1">
              <Link
                href={item.href}
                className={cn(
                  "flex-1 truncate rounded px-2 py-1 hover:bg-accent",
                  item.id === activeId && "bg-accent font-medium",
                )}
              >
                {item.title}
              </Link>
              <RowMenu
                busy={busy}
                canUp={index > 0}
                canDown={index < items.length - 1}
                deleteLabel={deleteLabel}
                onUp={() => run(() => onMove(item.id, "up"))}
                onDown={() => run(() => onMove(item.id, "down"))}
                onRename={() => rename(item.id, item.title)}
                onDelete={() => remove(item.id, item.title)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-1 border-t pt-3">
        <Input
          className="h-8"
          placeholder={createLabel}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={busy} onClick={add} aria-label={createLabel}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
