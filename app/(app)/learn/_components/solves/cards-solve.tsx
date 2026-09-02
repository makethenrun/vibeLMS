"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { FormattedText } from "@/components/shared/formatted-text";
import { cn } from "@/lib/utils";
import { feedbackClass, isCorrect } from "@/lib/materials/answer-check";
import type { CardsContent } from "@/lib/validators";
import type { Json } from "@/types";
import { ScoreBadge } from "../score-badge";
import { useSubmit } from "../use-submit";

function randomPick(n: number, count: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.max(1, Math.min(count, n)));
}

export function CardsSolve({
  itemId,
  content,
  initialScore,
  initialAnswer,
}: {
  itemId: string;
  content: CardsContent;
  initialScore: number | null | undefined;
  initialAnswer?: { picked?: number[]; answers?: string[] };
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const picked = useMemo(
    () => (initialAnswer?.picked && initialAnswer.picked.length > 0 ? initialAnswer.picked : randomPick(content.cards.length, content.count)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [answers, setAnswers] = useState<string[]>(() => picked.map((_, i) => initialAnswer?.answers?.[i] ?? ""));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = content.cards[picked[pos]];
  const isLastCard = pos === picked.length - 1;
  const answered = (answers[pos] ?? "").trim() !== "";

  function setAnswer(v: string) {
    setAnswers((prev) => prev.map((a, i) => (i === pos ? v : a)));
  }
  function go(delta: number) {
    setFlipped(false);
    setPos((p) => Math.min(picked.length - 1, Math.max(0, p + delta)));
  }
  async function onSubmit() {
    await submit({ picked, answers } as unknown as Json, content);
  }

  if (!card) return <p className="text-sm text-muted-foreground">Нет карточек.</p>;

  const ok = locked ? isCorrect(answers[pos], [card.answer]) : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Карточка {pos + 1} из {picked.length}</span>
        <ScoreBadge score={score} />
      </div>

      {/* Flip card: image on the front, hint on the back */}
      <div className="mx-auto w-full max-w-sm [perspective:1000px]">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={cn("relative block h-56 w-full transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}
          aria-label="Перевернуть карточку"
        >
          <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border bg-card [backface-visibility:hidden]">
            {card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground">
              <RotateCw className="h-3 w-3" /> подсказка
            </span>
          </span>
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl border bg-muted/40 p-4 text-center text-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {card.hint ? <FormattedText text={card.hint} /> : <span className="text-muted-foreground">Подсказки нет</span>}
          </span>
        </button>
      </div>

      <Input
        value={answers[pos] ?? ""}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Ваш ответ"
        disabled={locked}
        className={cn(locked && feedbackClass(true, ok))}
      />

      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => go(-1)} disabled={pos === 0}>
          <ChevronLeft className="h-4 w-4" /> Назад
        </Button>
        {locked ? (
          <Button type="button" size="sm" variant="outline" onClick={() => go(1)} disabled={isLastCard}>
            Далее <ChevronRight className="h-4 w-4" />
          </Button>
        ) : isLastCard ? (
          <LoadingButton size="sm" loading={saving} onClick={onSubmit} disabled={!answered}>Проверить</LoadingButton>
        ) : (
          <Button type="button" size="sm" onClick={() => go(1)} disabled={!answered}>
            Далее <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
