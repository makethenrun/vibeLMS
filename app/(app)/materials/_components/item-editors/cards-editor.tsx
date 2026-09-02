"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemContentSchema, type CardsContent, type ItemContent } from "@/lib/validators";

interface CardDraft {
  imageUrl: string;
  hint: string;
  answer: string;
}

interface EditorProps {
  content: CardsContent;
  onSave: (content: ItemContent) => Promise<void>;
}

interface UploadResponse {
  url?: string;
  error?: string;
}

export function CardsEditor({ content, onSave }: EditorProps) {
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [count, setCount] = useState(content.count);
  const [cards, setCards] = useState<CardDraft[]>(content.cards.length ? content.cards.map((c) => ({ ...c })) : [{ imageUrl: "", hint: "", answer: "" }]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function update(i: number, patch: Partial<CardDraft>) {
    setCards((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  async function uploadImage(i: number, file: File) {
    setUploading(i);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "materials");
      const res = await fetch("/api/storage/upload", { method: "POST", body: fd });
      const data = (await res.json()) as UploadResponse;
      if (!res.ok || !data.url) throw new Error(data.error ?? "Не удалось загрузить");
      update(i, { imageUrl: data.url });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    const filtered = cards.filter((c) => c.answer.trim());
    const candidate = {
      type: "CARDS" as const,
      prompt: prompt.trim() || null,
      count: Math.max(1, Math.min(count, filtered.length || 1)),
      cards: filtered,
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
      <div className="space-y-1">
        <label className="text-sm font-medium">Инструкция (необязательно)</label>
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Посмотрите на картинку и напишите слово" />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Показывать карточек:</label>
        <Input type="number" min={1} max={cards.length} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className="h-8 w-20" />
        <span className="text-xs text-muted-foreground">из {cards.length} (выбираются случайно)</span>
      </div>

      <div className="space-y-2">
        {cards.map((card, i) => (
          <div key={i} className="flex items-start gap-2 rounded-md border p-2">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {card.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input value={card.imageUrl} onChange={(e) => update(i, { imageUrl: e.target.value })} placeholder="URL картинки или эмодзи не нужен" className="h-8" />
                <Button type="button" size="sm" variant="outline" onClick={() => fileRefs.current[i]?.click()} disabled={uploading === i}>
                  {uploading === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                </Button>
                <input
                  ref={(el) => { fileRefs.current[i] = el; }}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(i, f); e.target.value = ""; }}
                />
              </div>
              <Input value={card.hint} onChange={(e) => update(i, { hint: e.target.value })} placeholder="Подсказка (обратная сторона)" className="h-8" />
              <Input value={card.answer} onChange={(e) => update(i, { answer: e.target.value })} placeholder="Правильный ответ" className="h-8" />
            </div>
            <Button type="button" size="icon" variant="ghost" className="text-destructive" disabled={cards.length <= 1}
              onClick={() => setCards((prev) => prev.filter((_, j) => j !== i))} aria-label="Удалить карточку">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setCards((prev) => [...prev, { imageUrl: "", hint: "", answer: "" }])}>
          <Plus className="h-4 w-4" />
          Карточка
        </Button>
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
