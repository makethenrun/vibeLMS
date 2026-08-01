"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type AudioContent, type ItemContent } from "@/lib/validators";
import { AudioPlayer } from "../media/audio-player";

interface EditorProps {
  content: AudioContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function AudioEditor({ content, onSave }: EditorProps) {
  const [audioUrl, setAudioUrl] = useState(content.audioUrl);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({ type: "AUDIO", audioUrl });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте аудио");
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
      {audioUrl ? (
        <AudioPlayer src={audioUrl} />
      ) : (
        <p className="text-sm text-muted-foreground">Аудио не загружено.</p>
      )}
      <FileUpload
        folder="materials"
        accept=".mp3,.m4a,.wav,.ogg,.aac"
        value={audioUrl || null}
        onUploaded={(url) => setAudioUrl(url ?? "")}
      />
      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
