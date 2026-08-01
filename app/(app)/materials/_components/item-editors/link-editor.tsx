"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type ItemContent, type LinkContent } from "@/lib/validators";

interface EditorProps {
  content: LinkContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function LinkEditor({ content, onSave }: EditorProps) {
  const [url, setUrl] = useState(content.url);
  const [label, setLabel] = useState(content.label ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({ type: "LINK", url, label: label.trim() || null });
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
        <label className="text-sm font-medium">Ссылка</label>
        <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Текст кнопки (необязательно)</label>
        <Input placeholder="Перейти по ссылке" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      {url ? (
        <Button asChild variant="outline" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            {label.trim() || "Перейти по ссылке"}
          </a>
        </Button>
      ) : null}
      <div>
        <LoadingButton size="sm" loading={saving} onClick={handleSave}>
          Сохранить
        </LoadingButton>
      </div>
    </div>
  );
}
