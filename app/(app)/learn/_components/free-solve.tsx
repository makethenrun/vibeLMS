"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

  const shown = hasEdit && showEdited ? (editedAnswer as string) : text;

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
          <span className="text-xs text-muted-foreground">{showEdited ? "После изменений" : "До изменений"}</span>
        </div>
      ) : null}
      <Textarea
        rows={4}
        value={locked ? shown : text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ваш ответ"
        disabled={locked}
      />
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Отправить</LoadingButton> : null}
    </div>
  );
}
