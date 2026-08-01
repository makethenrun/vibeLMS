"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type ItemContent, type MaterialQuestion, type QuizContent } from "@/lib/validators";
import { QuestionsEditor } from "./questions-editor";

interface EditorProps {
  content: QuizContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function QuizEditor({ content, onSave }: EditorProps) {
  const [questions, setQuestions] = useState<MaterialQuestion[]>(content.questions);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({ type: "QUIZ", questions });
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
      <QuestionsEditor initial={content.questions} onChange={setQuestions} />
      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
