"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Textarea } from "@/components/ui/textarea";
import { itemContentSchema, type FreeContent, type ItemContent } from "@/lib/validators";

interface EditorProps {
  content: FreeContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function FreeEditor({ content, onSave }: EditorProps) {
  const [prompt, setPrompt] = useState(content.prompt);
  const [sampleAnswer, setSampleAnswer] = useState(content.sampleAnswer ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const candidate = {
      type: "FREE" as const,
      prompt,
      sampleAnswer: sampleAnswer.trim() || null,
    };
    const parsed = itemContentSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте упражнение");
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Задание</label>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Образец ответа (необязательно)</label>
        <Textarea value={sampleAnswer} onChange={(e) => setSampleAnswer(e.target.value)} rows={2} />
      </div>
      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
