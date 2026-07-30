"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/utils/action-result";

export interface ChildItem {
  id: string;
  title: string;
  href: string;
}

interface ChildListProps {
  items: ChildItem[];
  createLabel: string;
  emptyLabel: string;
  onCreate: (title: string) => Promise<ActionResult>;
  onRename: (id: string, title: string) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  onMove: (id: string, direction: "up" | "down") => Promise<ActionResult>;
}

export function ChildList({
  items,
  createLabel,
  emptyLabel,
  onCreate,
  onRename,
  onDelete,
  onMove,
}: ChildListProps) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function run(action: () => Promise<ActionResult>, successMessage?: string) {
    setBusy(true);
    try {
      const result = await action();
      if (result.success) {
        if (successMessage) toast.success(successMessage);
        router.refresh();
        return true;
      }
      toast.error(result.error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    const title = newTitle.trim();
    if (title.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    const okDone = await run(() => onCreate(title), "Добавлено");
    if (okDone) setNewTitle("");
  }

  async function handleRename(id: string) {
    const title = editTitle.trim();
    if (title.length < 2) {
      toast.error("Минимум 2 символа");
      return;
    }
    const okDone = await run(() => onRename(id, title), "Переименовано");
    if (okDone) setEditingId(null);
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id}>
              <Card className="flex items-center gap-2 p-2">
                <div className="flex flex-col">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={busy || index === 0}
                    onClick={() => run(() => onMove(item.id, "up"))}
                    aria-label="Вверх"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={busy || index === items.length - 1}
                    onClick={() => run(() => onMove(item.id, "down"))}
                    aria-label="Вниз"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {editingId === item.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleRename(item.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                    <Button size="sm" disabled={busy} onClick={() => handleRename(item.id)}>
                      Сохранить
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} aria-label="Отмена">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link href={item.href} className="flex flex-1 items-center gap-2 font-medium hover:underline">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      {item.title}
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditTitle(item.title);
                      }}
                      aria-label="Переименовать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button size="icon" variant="ghost" className="text-destructive" aria-label="Удалить">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title="Удалить?"
                      description={`«${item.title}» и всё вложенное содержимое будут удалены.`}
                      confirmLabel="Удалить"
                      variant="destructive"
                      successMessage="Удалено"
                      action={() => onDelete(item.id)}
                    />
                  </>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder={createLabel}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleCreate();
          }}
        />
        <Button disabled={busy} onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          {createLabel}
        </Button>
      </div>
    </div>
  );
}
