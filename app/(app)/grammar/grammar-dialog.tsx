"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/shared/loading-button";
import type { GrammarEntry } from "@/types";
import { createGrammarAction, updateGrammarAction } from "./actions";

export function GrammarDialog({ entry, trigger }: { entry?: GrammarEntry; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(entry);

  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setBody(entry?.body ?? "");
    }
  }, [open, entry]);

  async function save() {
    if (title.trim().length < 1) return toast.error("Введите заголовок");
    setSaving(true);
    const input = { title: title.trim(), body };
    const result = isEdit ? await updateGrammarAction(entry!.id, input) : await createGrammarAction(input);
    setSaving(false);
    if (result.success) {
      toast.success(isEdit ? "Сохранено" : "Блок добавлен");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать блок" : "Новый блок"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Заголовок</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Present Simple" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Текст</label>
            <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Описание правила…" />
            <p className="text-xs text-muted-foreground">
              Разметка: [b]жирный[/b], [i]курсив[/i], [u]подчёркнутый[/u], [c=#ffcc00]выделение[/c]. Переносы строк сохраняются.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <LoadingButton loading={saving} onClick={save}>{isEdit ? "Сохранить" : "Добавить"}</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
