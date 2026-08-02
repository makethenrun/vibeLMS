"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { cn } from "@/lib/utils";
import type { QuizContent } from "@/lib/validators";
import type { Json } from "@/types";
import { submitItemAction } from "../actions";
import { ScoreBadge } from "./score-badge";

interface QuizSolveProps {
  itemId: string;
  content: QuizContent;
  initialScore: number | null | undefined;
}

interface Answer {
  selected: string[];
  text: string;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizSolve({ itemId, content, initialScore }: QuizSolveProps) {
  const hasTimer = content.timerSeconds !== null;
  const [started, setStarted] = useState(!hasTimer);
  const [remaining, setRemaining] = useState(content.timerSeconds ?? 0);
  const [answers, setAnswers] = useState<Answer[]>(content.questions.map(() => ({ selected: [], text: "" })));
  const [score, setScore] = useState<number | null | undefined>(initialScore);
  const [saving, setSaving] = useState(false);
  const submittedRef = useRef(score !== undefined);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSaving(true);
    try {
      const answer: Json = { questions: answers } as unknown as Json;
      const result = await submitItemAction(itemId, answer);
      if (result.success) {
        setScore(result.data.score);
        toast.success("Ответ отправлен");
      } else {
        submittedRef.current = false;
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }, [answers, itemId]);

  useEffect(() => {
    if (!started || !hasTimer || score !== undefined) return;
    if (remaining <= 0) {
      void submit();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [started, hasTimer, remaining, score, submit]);

  function toggleOption(qi: number, option: string) {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === qi
          ? { ...a, selected: a.selected.includes(option) ? a.selected.filter((o) => o !== option) : [...a.selected, option] }
          : a,
      ),
    );
  }

  const locked = score !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {hasTimer && !locked ? (
          <span className={cn("text-sm font-medium", remaining <= 10 && "text-destructive")}>
            Осталось: {fmt(remaining)}
          </span>
        ) : (
          <span />
        )}
        <ScoreBadge score={score} />
      </div>

      <div className={cn("relative", hasTimer && !started && "select-none")}>
        <div className={cn("space-y-4", hasTimer && !started && "pointer-events-none blur-sm")}>
          {content.questions.map((q, qi) => (
            <div key={qi} className="space-y-2">
              <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
              {q.options.length > 0 ? (
                <div className="space-y-1">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={answers[qi].selected.includes(opt)}
                        onChange={() => toggleOption(qi, opt)}
                      />
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

        {hasTimer && !started ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={() => setStarted(true)}>Начать тест ({fmt(content.timerSeconds ?? 0)})</Button>
          </div>
        ) : null}
      </div>

      {!locked && started ? (
        <LoadingButton size="sm" loading={saving} onClick={submit}>
          Отправить
        </LoadingButton>
      ) : null}
    </div>
  );
}
