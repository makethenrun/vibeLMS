"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Input } from "@/components/ui/input";
import { itemContentSchema, type ItemContent, type MaterialQuestion, type QuizContent } from "@/lib/validators";
import { QuestionsEditor } from "./questions-editor";

interface EditorProps {
  content: QuizContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function QuizEditor({ content, onSave }: EditorProps) {
  const [questions, setQuestions] = useState<MaterialQuestion[]>(content.questions);
  const [timerEnabled, setTimerEnabled] = useState(Boolean(content.timerSeconds));
  const [minutes, setMinutes] = useState(content.timerSeconds ? Math.round(content.timerSeconds / 60) : 5);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const timerSeconds = timerEnabled ? Math.max(1, Math.round(minutes)) * 60 : null;
    const parsed = itemContentSchema.safeParse({ type: "QUIZ", timerSeconds, questions });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте тест");
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-md border p-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={timerEnabled} onChange={(e) => setTimerEnabled(e.target.checked)} />
          Таймер
        </label>
        {timerEnabled ? (
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              min={1}
              max={120}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value) || 1)}
              className="h-8 w-20"
            />
            <span className="text-muted-foreground">мин · ученик запускает тест кнопкой, затем идёт отсчёт</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Без ограничения по времени</span>
        )}
      </div>

      <QuestionsEditor initial={content.questions} onChange={setQuestions} />

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
