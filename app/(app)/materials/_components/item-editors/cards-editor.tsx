"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { itemContentSchema, type CardsContent, type ItemContent } from "@/lib/validators";

interface CardDraft {
  imageUrl: string;
  hint: string;
  answer: string;
}

type Mode = "ANSWER" | "HINT_ONLY" | "WORDS";

interface EditorProps {
  content: CardsContent;
  onSave: (content: ItemContent) => Promise<void>;
}

interface UploadResponse {
  url?: string;
  error?: string;
}

function nonEmptyLines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function CardsEditor({ content, onSave }: EditorProps) {
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [mode, setMode] = useState<Mode>(content.mode);
  const [count, setCount] = useState(content.count);
  const [cards, setCards] = useState<CardDraft[]>(content.cards.length ? content.cards.map((c) => ({ ...c })) : [{ imageUrl: "", hint: "", answer: "" }]);
  // WORDS mode: word on the front (card.answer), translation on the back (card.hint).
  const [wordsText, setWordsText] = useState(() => (content.mode === "WORDS" ? content.cards.map((c) => c.answer).join("\n") : ""));
  const [transText, setTransText] = useState(() => (content.mode === "WORDS" ? content.cards.map((c) => c.hint).join("\n") : ""));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const poolSize = mode === "WORDS" ? nonEmptyLines(wordsText).length : cards.length;

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

  function buildCards(): CardDraft[] {
    if (mode === "WORDS") {
      const words = nonEmptyLines(wordsText);
      const trans = transText.split("\n").map((l) => l.trim());
      return words.map((w, i) => ({ imageUrl: "", hint: trans[i] ?? "", answer: w }));
    }
    // ANSWER needs a correct answer per card; HINT_ONLY keeps cards with image/hint.
    return cards.filter((c) => (mode === "ANSWER" ? c.answer.trim() : c.imageUrl.trim() || c.hint.trim()));
  }

  async function handleSave() {
    const built = buildCards();
    const candidate = {
      type: "CARDS" as const,
      prompt: prompt.trim() || null,
      mode,
      count: Math.max(1, Math.min(count, built.length || 1)),
      cards: built,
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

      <div className="space-y-1">
        <label className="text-sm font-medium">Режим</label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={mode === "ANSWER" ? "default" : "outline"} onClick={() => setMode("ANSWER")}>
            С ответами
          </Button>
          <Button type="button" size="sm" variant={mode === "HINT_ONLY" ? "default" : "outline"} onClick={() => setMode("HINT_ONLY")}>
            Без ответов (только подсказки)
          </Button>
          <Button type="button" size="sm" variant={mode === "WORDS" ? "default" : "outline"} onClick={() => setMode("WORDS")}>
            Слова
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === "ANSWER"
            ? "Ученик пишет ответ, задание оценивается."
            : mode === "HINT_ONLY"
              ? "Ученик листает и переворачивает карточки, чтобы увидеть подсказку. Без ввода и без оценки."
              : "На одной стороне слово, на другой — перевод. Ученик листает и переворачивает. Без оценки."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Показывать карточек:</label>
        <Input type="number" min={1} max={Math.max(1, poolSize)} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className="h-8 w-20" />
        <span className="text-xs text-muted-foreground">из {poolSize} (выбираются случайно)</span>
      </div>

      {mode === "WORDS" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Слова (по одному на строку)</label>
            <Textarea rows={8} value={wordsText} onChange={(e) => setWordsText(e.target.value)} placeholder={"爸爸\n妈妈\n弟弟"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Перевод (в том же порядке)</label>
            <Textarea rows={8} value={transText} onChange={(e) => setTransText(e.target.value)} placeholder={"папа\nмама\nмладший брат"} />
          </div>
        </div>
      ) : (
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
                {mode === "ANSWER" ? (
                  <Input value={card.answer} onChange={(e) => update(i, { answer: e.target.value })} placeholder="Правильный ответ" className="h-8" />
                ) : null}
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
      )}

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
