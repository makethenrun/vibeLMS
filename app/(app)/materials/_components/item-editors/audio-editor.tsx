"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type AudioContent, type ItemContent, type MaterialQuestion } from "@/lib/validators";
import { QuestionsEditor } from "./questions-editor";

interface EditorProps {
  content: AudioContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function AudioEditor({ content, onSave }: EditorProps) {
  const [audioUrl, setAudioUrl] = useState(content.audioUrl);
  const [questions, setQuestions] = useState<MaterialQuestion[]>(content.questions);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({ type: "AUDIO", audioUrl, questions });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте аудирование");
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
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Аудиофайл</label>
        {audioUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls src={audioUrl} className="w-full" />
        ) : (
          <p className="text-sm text-muted-foreground">Аудио не загружено.</p>
        )}
        <FileUpload
          folder="materials"
          accept=".mp3,.m4a,.wav,.ogg,.aac"
          value={audioUrl || null}
          onUploaded={(url) => setAudioUrl(url ?? "")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Вопросы к аудио</label>
        <QuestionsEditor initial={content.questions} onChange={setQuestions} />
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
