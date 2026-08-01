"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type ImageContent, type ItemContent } from "@/lib/validators";

interface EditorProps {
  content: ImageContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function ImageEditor({ content, onSave }: EditorProps) {
  const [url, setUrl] = useState(content.url);
  const [caption, setCaption] = useState(content.caption ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({ type: "IMAGE", url, caption: caption.trim() || null });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте изображение");
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
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={caption || "Изображение"} className="max-h-72 rounded-lg border object-contain" />
      ) : (
        <p className="text-sm text-muted-foreground">Изображение не задано.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Ссылка на изображение" value={url} onChange={(e) => setUrl(e.target.value)} />
        <FileUpload
          folder="materials"
          accept=".jpg,.jpeg,.png,.webp"
          value={url || null}
          onUploaded={(u) => setUrl(u ?? "")}
        />
      </div>
      <Input placeholder="Подпись (необязательно)" value={caption} onChange={(e) => setCaption(e.target.value)} />
      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
