"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type ItemContent, type VideoContent } from "@/lib/validators";
import { VideoEmbed } from "../media/video-embed";

interface EditorProps {
  content: VideoContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function VideoEditor({ content, onSave }: EditorProps) {
  const [url, setUrl] = useState(content.url);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({ type: "VIDEO", url });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте ссылку");
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
      <div className="space-y-1">
        <label className="text-sm font-medium">Ссылка на видео (YouTube, Vimeo или прямая)</label>
        <Input
          placeholder="https://youtube.com/watch?v=…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Видео не загружается на платформу — воспроизводится по ссылке.</p>
      </div>
      {url ? <VideoEmbed url={url} /> : null}
      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
