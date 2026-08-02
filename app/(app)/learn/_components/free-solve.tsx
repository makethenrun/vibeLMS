"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/shared/loading-button";
import type { FreeContent } from "@/lib/validators";
import type { Json } from "@/types";
import { submitItemAction } from "../actions";
import { ScoreBadge } from "./score-badge";

interface FreeSolveProps {
  itemId: string;
  content: FreeContent;
  initialAnswer: string;
  initialScore: number | null | undefined;
}

export function FreeSolve({ itemId, content, initialAnswer, initialScore }: FreeSolveProps) {
  const [text, setText] = useState(initialAnswer);
  const [score, setScore] = useState<number | null | undefined>(initialScore);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(initialScore !== undefined);

  async function submit() {
    if (text.trim() === "") {
      toast.error("Введите ответ");
      return;
    }
    setSaving(true);
    try {
      const answer: Json = { text } as unknown as Json;
      const result = await submitItemAction(itemId, answer);
      if (result.success) {
        setScore(result.data.score);
        setSent(true);
        toast.success("Ответ отправлен");
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm">{content.prompt}</p>
        <ScoreBadge score={score} />
      </div>
      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ваш ответ" />
      <LoadingButton size="sm" loading={saving} onClick={submit}>
        {sent ? "Обновить ответ" : "Отправить"}
      </LoadingButton>
    </div>
  );
}
