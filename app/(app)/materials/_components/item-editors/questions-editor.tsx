"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MaterialQuestion } from "@/lib/validators";
import type { GradingMode } from "@/types";

type Kind = "TEXT" | "CHOICE";

interface OptionDraft {
  text: string;
  correct: boolean;
}

interface QuestionDraft {
  question: string;
  kind: Kind;
  grading: GradingMode;
  correctAnswer: string;
  options: OptionDraft[];
}

function toDraft(q: MaterialQuestion): QuestionDraft {
  if (q.options.length > 0) {
    return {
      question: q.question,
      kind: "CHOICE",
      grading: q.grading,
      correctAnswer: "",
      options: q.options.map((text) => ({ text, correct: q.correctAnswers.includes(text) })),
    };
  }
  return {
    question: q.question,
    kind: "TEXT",
    grading: q.grading,
    correctAnswer: q.correctAnswer,
    options: [
      { text: "", correct: false },
      { text: "", correct: false },
    ],
  };
}

function toQuestion(d: QuestionDraft): MaterialQuestion {
  if (d.kind === "CHOICE") {
    const options = d.options.map((o) => o.text);
    return {
      question: d.question,
      options,
      correctAnswers: d.options.filter((o) => o.correct).map((o) => o.text),
      correctAnswer: "",
      grading: d.grading,
    };
  }
  return { question: d.question, options: [], correctAnswers: [], correctAnswer: d.correctAnswer, grading: d.grading };
}

interface QuestionsEditorProps {
  initial: MaterialQuestion[];
  onChange: (questions: MaterialQuestion[]) => void;
}

export function QuestionsEditor({ initial, onChange }: QuestionsEditorProps) {
  const [drafts, setDrafts] = useState<QuestionDraft[]>(() => initial.map(toDraft));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(drafts.map(toQuestion));
  }, [drafts]);

  function patch(index: number, patchObj: Partial<QuestionDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patchObj } : d)));
  }

  function patchOption(qi: number, oi: number, patchObj: Partial<OptionDraft>) {
    setDrafts((prev) =>
      prev.map((d, i) =>
        i === qi ? { ...d, options: d.options.map((o, j) => (j === oi ? { ...o, ...patchObj } : o)) } : d,
      ),
    );
  }

  function addQuestion() {
    setDrafts((prev) => [
      ...prev,
      { question: "", kind: "CHOICE", grading: "STRICT", correctAnswer: "", options: [
        { text: "", correct: true },
        { text: "", correct: false },
      ] },
    ]);
  }

  return (
    <div className="space-y-4">
      {drafts.map((d, qi) => (
        <div key={qi} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Вопрос {qi + 1}</span>
            <div className="ml-auto flex items-center gap-2">
              <Select value={d.kind} onValueChange={(v) => patch(qi, { kind: v as Kind })}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHOICE">Варианты</SelectItem>
                  <SelectItem value="TEXT">Свободный ответ</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                onClick={() => setDrafts((prev) => prev.filter((_, i) => i !== qi))}
                aria-label="Удалить вопрос"
                disabled={drafts.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Textarea
            placeholder="Текст вопроса"
            value={d.question}
            onChange={(e) => patch(qi, { question: e.target.value })}
          />

          {d.kind === "CHOICE" ? (
            <div className="space-y-2">
              {d.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={o.correct}
                    onChange={(e) => patchOption(qi, oi, { correct: e.target.checked })}
                    aria-label="Правильный вариант"
                  />
                  <Input
                    value={o.text}
                    placeholder={`Вариант ${oi + 1}`}
                    onChange={(e) => patchOption(qi, oi, { text: e.target.value })}
                  />
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                    onClick={() => patch(qi, { options: d.options.filter((_, j) => j !== oi) })}
                    aria-label="Удалить вариант"
                    disabled={d.options.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline"
                  onClick={() => patch(qi, { options: [...d.options, { text: "", correct: false }] })}>
                  <Plus className="h-4 w-4" />
                  Вариант
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  <span>Оценка:</span>
                  <Select value={d.grading} onValueChange={(v) => patch(qi, { grading: v as GradingMode })}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRICT">Строгая</SelectItem>
                      <SelectItem value="PARTIAL">Частичная</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <Input
              placeholder="Правильный ответ"
              value={d.correctAnswer}
              onChange={(e) => patch(qi, { correctAnswer: e.target.value })}
            />
          )}
        </div>
      ))}

      <Button size="sm" variant="outline" onClick={addQuestion}>
        <Plus className="h-4 w-4" />
        Добавить вопрос
      </Button>
    </div>
  );
}
