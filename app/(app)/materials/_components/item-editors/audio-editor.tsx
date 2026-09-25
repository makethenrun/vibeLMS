"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { audioUrls, itemContentSchema, type AudioContent, type ItemContent } from "@/lib/validators";
import { AudioPlayer } from "../media/audio-player";

interface EditorProps {
  content: AudioContent;
  onSave: (content: ItemContent) => Promise<void>;
}

const MAX_AUDIOS = 20;

export function AudioEditor({ content, onSave }: EditorProps) {
  const [audios, setAudios] = useState<string[]>(audioUrls(content));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function move(index: number, dir: -1 | 1) {
    setAudios((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function uploadOne(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "materials");
    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      toast.error(data.error ?? "Ошибка загрузки");
      return null;
    }
    return data.url;
  }

  async function handleFiles(files: FileList) {
    const remaining = MAX_AUDIOS - audios.length;
    if (remaining <= 0) {
      toast.error(`Не более ${MAX_AUDIOS} записей`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    const next = [...audios];
    try {
      for (const file of selected) {
        const url = await uploadOne(file);
        if (url) next.push(url);
      }
      setAudios(next);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({ type: "AUDIO", audioUrl: audios[0] ?? "", audios });
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
      {audios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Аудио не загружено.</p>
      ) : (
        <div className="space-y-2">
          {audios.map((url, index) => (
            <div key={`${index}-${url}`} className="flex items-center gap-2 rounded-md border p-2">
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <AudioPlayer src={url} />
              </div>
              <div className="flex shrink-0 flex-col">
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Вверх">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === audios.length - 1} onClick={() => move(index, 1)} aria-label="Вниз">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={() => setAudios((prev) => prev.filter((_, i) => i !== index))} aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.m4a,.wav,.ogg,.aac"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) void handleFiles(files);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading || audios.length >= MAX_AUDIOS}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Добавить аудио (можно несколько)
      </Button>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
