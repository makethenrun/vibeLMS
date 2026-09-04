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

// Card-face font sizes for the WORDS mode. Latin/Cyrillic use the normal size;
// hanzi (CJK ideographs) use "Крупный" — 4rem vs the normal text-2xl (1.5rem)
// so a single character fills the card.
const CARD_FACE_NORMAL = "text-[4rem] leading-none";
const CARD_FACE_HANZI = "text-[4rem] leading-none"; // «Крупный» — 4rem, только для иероглифов
const HANZI_RE = /[㐀-鿿豈-﫿]/;

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
  const studyMode = content.mode !== "ANSWER"; // HINT_ONLY or WORDS: flip-only, no score
  const textFront = content.mode === "WORDS"; // word on the front, translation on the back
  const backLabel = textFront ? "перевод" : "подсказка";
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
    await submit({ picked, answers: studyMode ? [] : answers } as unknown as Json, content);
  }

  if (!card) return <p className="text-sm text-muted-foreground">Нет карточек.</p>;

  const ok = locked && !studyMode ? isCorrect(answers[pos], [card.answer]) : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Карточка {pos + 1} из {picked.length}</span>
        {studyMode ? (locked ? <span className="text-xs text-muted-foreground">Просмотрено</span> : null) : <ScoreBadge score={score} />}
      </div>

      {/* Flip card: image on the front, hint on the back */}
      <div className="mx-auto w-full max-w-sm [perspective:1000px]">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={cn("relative block h-56 w-full transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}
          aria-label="Перевернуть карточку"
        >
          <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border bg-card p-4 text-center [backface-visibility:hidden]">
            {textFront ? (
              <span className={cn("font-semibold", HANZI_RE.test(card.answer) ? CARD_FACE_HANZI : CARD_FACE_NORMAL)}>
                <FormattedText text={card.answer} />
              </span>
            ) : card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground">
              <RotateCw className="h-3 w-3" /> {backLabel}
            </span>
          </span>
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl border bg-muted/40 p-4 text-center text-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {card.hint ? <FormattedText text={card.hint} /> : <span className="text-muted-foreground">{textFront ? "Перевода нет" : "Подсказки нет"}</span>}
          </span>
        </button>
      </div>

      {studyMode ? null : (
        <Input
          value={answers[pos] ?? ""}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Ваш ответ"
          disabled={locked}
          className={cn(locked && feedbackClass(true, ok))}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => go(-1)} disabled={pos === 0}>
          <ChevronLeft className="h-4 w-4" /> Назад
        </Button>
        {locked ? (
          <Button type="button" size="sm" variant="outline" onClick={() => go(1)} disabled={isLastCard}>
            Далее <ChevronRight className="h-4 w-4" />
          </Button>
        ) : isLastCard ? (
          <LoadingButton size="sm" loading={saving} onClick={onSubmit} disabled={!studyMode && !answered}>
            {studyMode ? "Готово" : "Проверить"}
          </LoadingButton>
        ) : (
          <Button type="button" size="sm" onClick={() => go(1)} disabled={!studyMode && !answered}>
            Далее <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Review: after submitting in ANSWER mode, show each card with the answer. */}
      {locked && !studyMode ? (
        <div className="space-y-1 rounded-lg border p-2">
          <p className="text-xs font-medium text-muted-foreground">Ваши ответы</p>
          <ul className="space-y-1">
            {picked.map((cardIdx, i) => {
              const c = content.cards[cardIdx];
              if (!c) return null;
              const correct = isCorrect(answers[i], [c.answer]);
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <span className={cn("flex-1 rounded-md px-2 py-1 text-sm", feedbackClass(true, correct))}>
                    {answers[i]?.trim() ? answers[i] : <span className="text-muted-foreground">—</span>}
                    {!correct ? <span className="ml-1 text-xs text-green-700">({c.answer})</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
