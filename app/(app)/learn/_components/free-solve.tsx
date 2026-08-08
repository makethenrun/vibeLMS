"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { FormattedText } from "@/components/shared/formatted-text";
import { LoadingButton } from "@/components/shared/loading-button";
import type { FreeContent } from "@/lib/validators";
import type { Json } from "@/types";
import { ScoreBadge } from "./score-badge";
import { useSubmit } from "./use-submit";

interface FreeSolveProps {
  itemId: string;
  content: FreeContent;
  initialAnswer: string;
  initialScore: number | null | undefined;
}

export function FreeSolve({ itemId, content, initialAnswer, initialScore }: FreeSolveProps) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const [text, setText] = useState(initialAnswer);

  async function onSubmit() {
    if (text.trim() === "") {
      toast.error("Введите ответ");
      return;
    }
    await submit({ text } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm"><FormattedText text={content.prompt} /></p>
        <ScoreBadge score={score} />
      </div>
      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ваш ответ" disabled={locked} />
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Отправить</LoadingButton> : null}
    </div>
  );
}
