"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/shared/loading-button";
import { setEditedAnswerAction } from "@/app/(app)/materials/actions";

/** Tutor/assistant corrections to a student's free-text answer during a session. */
export function FreeAnswerEditor({ studentId, itemId, initial }: { studentId: string; itemId: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await setEditedAnswerAction(studentId, itemId, text.trim() === "" ? null : text);
    setSaving(false);
    if (res.success) toast.success("Правки сохранены");
    else toast.error(res.error);
  }

  return (
    <div className="space-y-1 rounded-md border bg-muted/30 p-2">
      <label className="text-xs font-medium text-muted-foreground">Правки ответа (увидит ученик)</label>
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Исправленный вариант…" />
      <LoadingButton size="sm" loading={saving} onClick={save}>Сохранить правки</LoadingButton>
    </div>
  );
}
