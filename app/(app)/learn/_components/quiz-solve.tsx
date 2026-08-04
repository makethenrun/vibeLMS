"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { cn } from "@/lib/utils";
import type { QuizContent } from "@/lib/validators";
import type { Json } from "@/types";
import { ScoreBadge } from "./score-badge";
import { ReviewContext } from "./submit-context";
import { useSubmit } from "./use-submit";

interface Answer {
  selected: string[];
  text: string;
}

interface QuizSolveProps {
  itemId: string;
  content: QuizContent;
  initialScore: number | null | undefined;
  initialAnswer?: { questions?: Partial<Answer>[] };
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizSolve({ itemId, content, initialScore, initialAnswer }: QuizSolveProps) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const review = useContext(ReviewContext);
  const hasTimer = content.timerSeconds !== null;
  const showTimer = hasTimer && !review && !locked;

  const [started, setStarted] = useState(!showTimer);
  const [remaining, setRemaining] = useState(content.timerSeconds ?? 0);
  const [answers, setAnswers] = useState<Answer[]>(
    content.questions.map((_, i) => ({
      selected: initialAnswer?.questions?.[i]?.selected ?? [],
      text: initialAnswer?.questions?.[i]?.text ?? "",
    })),
  );
  const submittedRef = useRef(score !== undefined);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    await submit({ questions: answers } as unknown as Json, content);
  }, [answers, content, submit]);

  useEffect(() => {
    if (!showTimer || !started || locked) return;
    if (remaining <= 0) {
      void doSubmit();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [showTimer, started, remaining, locked, doSubmit]);

  function toggleOption(qi: number, option: string) {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === qi
          ? { ...a, selected: a.selected.includes(option) ? a.selected.filter((o) => o !== option) : [...a.selected, option] }
          : a,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {showTimer && started ? (
          <span className={cn("text-sm font-medium", remaining <= 10 && "text-destructive")}>Осталось: {fmt(remaining)}</span>
        ) : (
          <span />
        )}
        <ScoreBadge score={score} />
      </div>

      <div className="relative">
        <div className={cn("space-y-4", showTimer && !started && "pointer-events-none blur-sm")}>
          {content.questions.map((q, qi) => (
            <div key={qi} className="space-y-2">
              <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
              {q.options.length > 0 ? (
                <div className="space-y-1">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" disabled={locked} checked={answers[qi].selected.includes(opt)} onChange={() => toggleOption(qi, opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <Input
                  disabled={locked}
                  placeholder="Ваш ответ"
                  value={answers[qi].text}
                  onChange={(e) => setAnswers((prev) => prev.map((a, i) => (i === qi ? { ...a, text: e.target.value } : a)))}
                />
              )}
            </div>
          ))}
        </div>

        {showTimer && !started ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={() => setStarted(true)}>Начать тест ({fmt(content.timerSeconds ?? 0)})</Button>
          </div>
        ) : null}
      </div>

      {!locked && started ? (
        <LoadingButton size="sm" loading={saving} onClick={doSubmit}>Отправить</LoadingButton>
      ) : null}
    </div>
  );
}
