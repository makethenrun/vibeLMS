"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { LoadingButton } from "@/components/shared/loading-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MaterialRow } from "@/types";
import { updateMaterialAction } from "../actions";

export function MaterialCover({ material }: { material: MaterialRow }) {
  const router = useRouter();
  const [coverUrl, setCoverUrl] = useState(material.cover_url ?? "");
  const [description, setDescription] = useState(material.description ?? "");
  const [saving, setSaving] = useState(false);

  async function save(next: { coverUrl?: string; description?: string }) {
    setSaving(true);
    try {
      const result = await updateMaterialAction(material.id, {
        title: material.title,
        description: next.description ?? description,
        coverUrl: next.coverUrl ?? coverUrl,
      });
      if (result.success) {
        toast.success("Сохранено");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Обложка</label>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="Обложка материала" className="max-h-64 w-full rounded-lg border object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Обложка не задана
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Ссылка на изображение (https://…)"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            onBlur={() => save({ coverUrl })}
          />
          <FileUpload
            folder="materials"
            accept=".jpg,.jpeg,.png,.webp"
            value={coverUrl || null}
            onUploaded={(url) => {
              const next = url ?? "";
              setCoverUrl(next);
              void save({ coverUrl: next });
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Описание материала</label>
        <Textarea
          rows={5}
          placeholder="О чём этот материал…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <LoadingButton size="sm" loading={saving} onClick={() => save({ description })}>
          Сохранить описание
        </LoadingButton>
      </div>
    </div>
  );
}
