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
  initialAnswers: string[];
  lastScore: number | null;
  initialResults: boolean[] | null;
}

export function QuizForm({
  homeworkId,
  questions,
  initialAnswers,
  lastScore,
  initialResults,
}: QuizFormProps) {
  const router = useRouter();
  const [view, setView] = useState<"form" | "results">(
    initialResults ? "results" : "form",
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    questions.map((_, index) => initialAnswers[index] ?? ""),
  );
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>(() =>
    questions.map((_, index) => initialAnswers[index] ?? ""),
  );
  const [results, setResults] = useState<boolean[] | null>(initialResults);
  const [score, setScore] = useState<number | null>(lastScore);
  const [submitting, setSubmitting] = useState(false);

  function update(index: number, value: string) {
    setAnswers((previous) => {
      const next = [...previous];
      next[index] = value;
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
      setSubmittedAnswers([...answers]);
      setView("results");
      toast.success(`Тест проверен: ${result.data.score} из 100`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function retake() {
    setAnswers(questions.map(() => ""));
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
            const correct = results?.[index] ?? false;
            const given = submittedAnswers[index] ?? "";
            return (
              <div
                key={question.id}
                className={cn(
                  "rounded-md border p-3 text-sm",
                  correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">
                    {index + 1}. {question.question}
                  </p>
                  {correct ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-red-600" />
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
        return (
          <div key={question.id} className="space-y-1.5">
            <p className="text-sm font-medium">
              {index + 1}. {question.question}
            </p>
            {isChoice ? (
              <div className="space-y-1.5">
                {options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      className="h-4 w-4"
                      checked={answers[index] === option}
                      onChange={() => update(index, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <Input
                value={answers[index] ?? ""}
                onChange={(event) => update(index, event.target.value)}
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
