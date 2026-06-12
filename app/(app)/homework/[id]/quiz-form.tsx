"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { cn } from "@/lib/utils";
import type { QuizQuestionForStudent } from "@/types";
import { submitQuizAction } from "../actions";

interface QuizFormProps {
  homeworkId: string;
  questions: QuizQuestionForStudent[];
  initialAnswers: string[][];
  lastScore: number | null;
  initialResults: number[] | null;
}

export function QuizForm({
  homeworkId,
  questions,
  initialAnswers,
  lastScore,
  initialResults,
}: QuizFormProps) {
  const router = useRouter();
  const [view, setView] = useState<"form" | "results">(initialResults ? "results" : "form");
  const [answers, setAnswers] = useState<string[][]>(() =>
    questions.map((_, index) => initialAnswers[index] ?? []),
  );
  const [submittedAnswers, setSubmittedAnswers] = useState<string[][]>(() =>
    questions.map((_, index) => initialAnswers[index] ?? []),
  );
  const [results, setResults] = useState<number[] | null>(initialResults);
  const [score, setScore] = useState<number | null>(lastScore);
  const [submitting, setSubmitting] = useState(false);

  function setText(index: number, value: string) {
    setAnswers((previous) => {
      const next = [...previous];
      next[index] = value === "" ? [] : [value];
      return next;
    });
  }

  function toggleOption(index: number, option: string, checked: boolean) {
    setAnswers((previous) => {
      const next = [...previous];
      const current = next[index] ?? [];
      next[index] = checked ? [...current, option] : current.filter((item) => item !== option);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await submitQuizAction(homeworkId, { answers });
    setSubmitting(false);

    if (result.success) {
      setScore(result.data.score);
      setResults(result.data.results);
      setSubmittedAnswers(answers.map((selected) => [...selected]));
      setView("results");
      toast.success(`Тест проверен: ${result.data.score} из 100`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function retake() {
    setAnswers(questions.map(() => []));
    setView("form");
  }

  if (view === "results") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          Ваш результат: <span className="font-semibold">{score} из 100</span>
        </div>

        <div className="space-y-2">
          {questions.map((question, index) => {
            const fraction = results?.[index] ?? 0;
            const full = fraction >= 1;
            const none = fraction <= 0;
            const percent = Math.round(fraction * 100);
            const given = (submittedAnswers[index] ?? []).join(", ");
            return (
              <div
                key={question.id}
                className={cn(
                  "rounded-md border p-3 text-sm",
                  full
                    ? "border-emerald-200 bg-emerald-50"
                    : none
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">
                    {index + 1}. {question.question}
                  </p>
                  {full ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : none ? (
                    <X className="h-4 w-4 shrink-0 text-red-600" />
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-amber-600">{percent}%</span>
                  )}
                </div>
                <p className="text-muted-foreground">Ваш ответ: {given || "—"}</p>
              </div>
            );
          })}
        </div>

        <LoadingButton type="button" variant="outline" onClick={retake}>
          Пройти заново
        </LoadingButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {questions.map((question, index) => {
        const options = question.options ?? [];
        const isChoice = options.length > 0;
        const selected = answers[index] ?? [];
        return (
          <div key={question.id} className="space-y-1.5">
            <p className="text-sm font-medium">
              {index + 1}. {question.question}
              {isChoice && options.length > 1 ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (можно выбрать несколько)
                </span>
              ) : null}
            </p>
            {isChoice ? (
              <div className="space-y-1.5">
                {options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-primary"
                      checked={selected.includes(option)}
                      onChange={(event) => toggleOption(index, option, event.target.checked)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <Input
                value={selected[0] ?? ""}
                onChange={(event) => setText(index, event.target.value)}
                placeholder="Ваш ответ"
              />
            )}
          </div>
        );
      })}

      <LoadingButton type="submit" loading={submitting}>
        Отправить ответы
      </LoadingButton>
    </form>
  );
}
