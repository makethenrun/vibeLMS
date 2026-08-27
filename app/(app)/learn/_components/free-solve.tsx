"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormattedText } from "@/components/shared/formatted-text";
import { LoadingButton } from "@/components/shared/loading-button";
import { AnswerDiff } from "./answer-diff";
import type { FreeContent } from "@/lib/validators";
import type { Json } from "@/types";
import { ScoreBadge } from "./score-badge";
import { useSubmit } from "./use-submit";

interface FreeSolveProps {
  itemId: string;
  content: FreeContent;
  initialAnswer: string;
  initialScore: number | null | undefined;
  /** Tutor/assistant correction of this answer, if any. */
  editedAnswer?: string | null;
}

export function FreeSolve({ itemId, content, initialAnswer, initialScore, editedAnswer }: FreeSolveProps) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const [text, setText] = useState(initialAnswer);
  const hasEdit = locked && Boolean(editedAnswer);
  const [showEdited, setShowEdited] = useState(true);

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

      {hasEdit ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowEdited((s) => !s)}>
            <RefreshCcw className="h-4 w-4" />
            {showEdited ? "Показать до изменений" : "Показать после изменений"}
          </Button>
          <span className="text-xs text-muted-foreground">{showEdited ? "После изменений — правки выделены красным" : "До изменений"}</span>
        </div>
      ) : null}

      {locked ? (
        <div className="min-h-[5rem] rounded-md border bg-background p-3">
          {hasEdit && showEdited ? (
            <AnswerDiff original={text} edited={editedAnswer as string} />
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">{text}</p>
          )}
        </div>
      ) : (
        <>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ваш ответ" />
          <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Отправить</LoadingButton>
        </>
      )}
    </div>
  );
}
