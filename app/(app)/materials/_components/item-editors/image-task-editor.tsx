"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  itemContentSchema,
  type ImageTaskContent,
  type ImageTaskVariant,
  type ItemContent,
} from "@/lib/validators";

const VARIANTS: { value: ImageTaskVariant; label: string }[] = [
  { value: "DRAG_IMAGE_TO_WORD", label: "Перенести изображение к слову" },
  { value: "DRAG_WORD_TO_IMAGE", label: "Перенести слово к изображению" },
  { value: "TYPE_WORD", label: "Ввести слово к изображению" },
  { value: "SELECT_WORD", label: "Выбрать слово к изображению из списка" },
  { value: "SELECT_IMAGES", label: "Выбрать верные изображения" },
];

interface PairDraft {
  imageUrl: string;
  word: string;
}
interface ImageDraft {
  imageUrl: string;
  correct: boolean;
}

interface EditorProps {
  content: ImageTaskContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function ImageTaskEditor({ content, onSave }: EditorProps) {
  const [variant, setVariant] = useState<ImageTaskVariant>(content.variant ?? "TYPE_WORD");
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [pairs, setPairs] = useState<PairDraft[]>(
    content.pairs.length > 0 ? content.pairs.map((p) => ({ ...p })) : [{ imageUrl: "", word: "" }],
  );
  const [distractorsText, setDistractorsText] = useState(content.distractors.join(", "));
  const [images, setImages] = useState<ImageDraft[]>(
    content.images.length > 0 ? content.images.map((i) => ({ ...i })) : [{ imageUrl: "", correct: false }],
  );
  const [saving, setSaving] = useState(false);

  const isSelectImages = variant === "SELECT_IMAGES";

  function patchPair(i: number, p: Partial<PairDraft>) {
    setPairs((prev) => prev.map((x, j) => (j === i ? { ...x, ...p } : x)));
  }
  function patchImage(i: number, p: Partial<ImageDraft>) {
    setImages((prev) => prev.map((x, j) => (j === i ? { ...x, ...p } : x)));
  }

  async function handleSave() {
    const candidate = {
      type: "IMAGE_TASK" as const,
      variant,
      prompt: prompt.trim() || null,
      pairs: isSelectImages
        ? []
        : pairs.filter((p) => p.imageUrl.trim() !== "" && p.word.trim() !== ""),
      distractors:
        variant === "SELECT_WORD"
          ? distractorsText.split(",").map((s) => s.trim()).filter((s) => s !== "")
          : [],
      images: isSelectImages ? images.filter((i) => i.imageUrl.trim() !== "") : [],
    };
    const parsed = itemContentSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте упражнение");
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
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Вариация:</span>
        <Select value={variant} onValueChange={(v) => setVariant(v as ImageTaskVariant)}>
          <SelectTrigger className="h-8 w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VARIANTS.map((v) => (
              <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input placeholder="Инструкция (необязательно)" value={prompt} onChange={(e) => setPrompt(e.target.value)} />

      {isSelectImages ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Изображения (отметьте верные)</label>
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border p-2">
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={img.correct} onChange={(e) => patchImage(i, { correct: e.target.checked })} />
                верное
              </label>
              {img.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
              ) : null}
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <Input placeholder="Ссылка на изображение" value={img.imageUrl} onChange={(e) => patchImage(i, { imageUrl: e.target.value })} />
                <FileUpload folder="materials" accept=".jpg,.jpeg,.png,.webp" value={img.imageUrl || null} onUploaded={(u) => patchImage(i, { imageUrl: u ?? "" })} />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setImages((prev) => [...prev, { imageUrl: "", correct: false }])}>
            Добавить изображение
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">Пары «изображение — слово»</label>
          {pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border p-2">
              {pair.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pair.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
              ) : null}
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Ссылка на изображение" value={pair.imageUrl} onChange={(e) => patchPair(i, { imageUrl: e.target.value })} />
                  <FileUpload folder="materials" accept=".jpg,.jpeg,.png,.webp" value={pair.imageUrl || null} onUploaded={(u) => patchPair(i, { imageUrl: u ?? "" })} />
                </div>
                <Input placeholder="Слово / подпись" value={pair.word} onChange={(e) => patchPair(i, { word: e.target.value })} />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setPairs((prev) => prev.filter((_, j) => j !== i))} aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setPairs((prev) => [...prev, { imageUrl: "", word: "" }])}>
            Добавить пару
          </Button>

          {variant === "SELECT_WORD" ? (
            <div className="space-y-1 pt-1">
              <label className="text-xs text-muted-foreground">Лишние варианты для списка (через запятую, необязательно)</label>
              <Input value={distractorsText} onChange={(e) => setDistractorsText(e.target.value)} placeholder="banana, cherry" />
            </div>
          ) : null}
        </div>
      )}

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
