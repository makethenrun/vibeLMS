"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type CarouselContent, type ItemContent } from "@/lib/validators";
import { Carousel } from "../media/carousel";

interface ImageDraft {
  url: string;
  caption: string;
}

interface EditorProps {
  content: CarouselContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function CarouselEditor({ content, onSave }: EditorProps) {
  const [images, setImages] = useState<ImageDraft[]>(
    content.images.map((i) => ({ url: i.url, caption: i.caption ?? "" })),
  );
  const [saving, setSaving] = useState(false);

  function patch(index: number, p: Partial<ImageDraft>) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...p } : img)));
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function handleSave() {
    const parsed = itemContentSchema.safeParse({
      type: "CAROUSEL",
      images: images.filter((i) => i.url.trim() !== "").map((i) => ({ url: i.url, caption: i.caption.trim() || null })),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте карусель");
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.data);
    } finally {
      setSaving(false);
    }
  }

  const preview = images
    .filter((i) => i.url.trim() !== "")
    .map((i) => ({ url: i.url, caption: i.caption.trim() || null }));

  return (
    <div className="space-y-3">
      {preview.length > 0 ? <Carousel images={preview} /> : null}

      <div className="space-y-2">
        {images.map((img, index) => (
          <div key={index} className="flex items-start gap-2 rounded-md border p-2">
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="Ссылка на изображение" value={img.url} onChange={(e) => patch(index, { url: e.target.value })} />
                <FileUpload
                  folder="materials"
                  accept=".jpg,.jpeg,.png,.webp"
                  value={img.url || null}
                  onUploaded={(u) => patch(index, { url: u ?? "" })}
                />
              </div>
              <Input placeholder="Подпись (необязательно)" value={img.caption} onChange={(e) => patch(index, { caption: e.target.value })} />
            </div>
            <div className="flex flex-col">
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Вверх">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === images.length - 1} onClick={() => move(index, 1)} aria-label="Вниз">
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))} aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setImages((prev) => [...prev, { url: "", caption: "" }])}>
          Добавить изображение
        </Button>
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
