"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";

import { cn, formatDateTime } from "@/lib/utils";

export interface AttemptQuestionResult {
  id: string;
  question: string;
  given: string;
  fraction: number;
  correctText: string;
}

export interface AttemptView {
  attemptNo: number;
  score: number | null;
  createdAt: string;
  breakdown: AttemptQuestionResult[];
}

/** Tutor-only: a collapsible list of a student's quiz attempts with per-question detail. */
export function TutorAttempts({ attempts }: { attempts: AttemptView[] }) {
  const [openNo, setOpenNo] = useState<number | null>(null);
  if (attempts.length === 0) return null;

  return (
    <div className="rounded-md border">
      <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
        Попытки ({attempts.length})
      </p>
      <ul className="divide-y">
        {attempts.map((attempt) => {
          const open = openNo === attempt.attemptNo;
          return (
            <li key={attempt.attemptNo}>
              <button
                type="button"
                onClick={() => setOpenNo(open ? null : attempt.attemptNo)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  {open ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">Попытка {attempt.attemptNo}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(attempt.createdAt)}
                  </span>
                </span>
                <span className="font-semibold">{attempt.score ?? "—"}</span>
              </button>

              {open ? (
                <div className="space-y-1.5 px-3 pb-3">
                  {attempt.breakdown.map((item) => {
                    const full = item.fraction >= 1;
                    const none = item.fraction <= 0;
                    const percent = Math.round(item.fraction * 100);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-md border p-2 text-sm",
                          full
                            ? "border-emerald-200 bg-emerald-50"
                            : none
                              ? "border-red-200 bg-red-50"
                              : "border-amber-200 bg-amber-50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{item.question}</p>
                          {full ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                          ) : none ? (
                            <X className="h-4 w-4 shrink-0 text-red-600" />
                          ) : (
                            <span className="shrink-0 text-xs font-semibold text-amber-600">
                              {percent}%
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground">Ответ ученика: {item.given || "—"}</p>
                        {!full ? (
                          <p className="text-muted-foreground">Правильно: {item.correctText}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
