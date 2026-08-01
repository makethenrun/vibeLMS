"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  type ItemContent,
  type SentenceTaskContent,
  type SentenceTaskVariant,
} from "@/lib/validators";

const VARIANTS: { value: SentenceTaskVariant; label: string }[] = [
  { value: "WORD_ORDER", label: "Расставить слова в правильном порядке" },
  { value: "SORT_COLUMNS", label: "Отсортировать по группам (колонкам)" },
  { value: "SENTENCE_ORDER", label: "Расставить предложения по порядку" },
  { value: "WORD_FROM_LETTERS", label: "Составить слово из букв" },
  { value: "MATCH_PAIRS", label: "Сопоставить слова" },
];

interface ColumnDraft {
  title: string;
  itemsText: string;
}
interface PairDraft {
  left: string;
  right: string;
}

interface EditorProps {
  content: SentenceTaskContent;
  onSave: (content: ItemContent) => Promise<void>;
}

function parseList(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter((s) => s !== "");
}

export function SentenceTaskEditor({ content, onSave }: EditorProps) {
  const [variant, setVariant] = useState<SentenceTaskVariant>(content.variant ?? "WORD_ORDER");
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [wordOrderText, setWordOrderText] = useState(content.words.join(" "));
  const [sentences, setSentences] = useState<string[]>(content.sentences.length ? content.sentences : [""]);
  const [word, setWord] = useState(content.word);
  const [extraLetters, setExtraLetters] = useState(content.extraLetters);
  const [columns, setColumns] = useState<ColumnDraft[]>(
    content.columns.length
      ? content.columns.map((c) => ({ title: c.title, itemsText: c.items.join(", ") }))
      : [{ title: "", itemsText: "" }, { title: "", itemsText: "" }],
  );
  const [pairs, setPairs] = useState<PairDraft[]>(
    content.pairs.length ? content.pairs.map((p) => ({ ...p })) : [{ left: "", right: "" }],
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const candidate = {
      type: "SENTENCE_TASK" as const,
      variant,
      prompt: prompt.trim() || null,
      words: variant === "WORD_ORDER" ? wordOrderText.split(/\s+/).filter(Boolean) : [],
      sentences: variant === "SENTENCE_ORDER" ? sentences.map((s) => s.trim()).filter(Boolean) : [],
      word: variant === "WORD_FROM_LETTERS" ? word.trim() : "",
      extraLetters: variant === "WORD_FROM_LETTERS" ? extraLetters.trim() : "",
      columns:
        variant === "SORT_COLUMNS"
          ? columns.filter((c) => c.title.trim()).map((c) => ({ title: c.title.trim(), items: parseList(c.itemsText) }))
          : [],
      pairs: variant === "MATCH_PAIRS" ? pairs.filter((p) => p.left.trim() && p.right.trim()) : [],
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
        <Select value={variant} onValueChange={(v) => setVariant(v as SentenceTaskVariant)}>
          <SelectTrigger className="h-8 w-80">
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

      {variant === "WORD_ORDER" ? (
        <div className="space-y-1">
          <label className="text-sm font-medium">Предложение (слова через пробел, в правильном порядке)</label>
          <Textarea value={wordOrderText} onChange={(e) => setWordOrderText(e.target.value)} rows={2} placeholder="I like green tea" />
          <p className="text-xs text-muted-foreground">Ученик получит перемешанные слова и соберёт предложение.</p>
        </div>
      ) : null}

      {variant === "SENTENCE_ORDER" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Предложения в правильном порядке</label>
          {sentences.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
              <Input value={s} onChange={(e) => setSentences((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} />
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0}
                onClick={() => setSentences((prev) => { const n = [...prev]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} aria-label="Вверх">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === sentences.length - 1}
                onClick={() => setSentences((prev) => { const n = [...prev]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} aria-label="Вниз">
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                onClick={() => setSentences((prev) => prev.filter((_, j) => j !== i))} aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setSentences((prev) => [...prev, ""])}>
            <Plus className="h-4 w-4" />
            Предложение
          </Button>
        </div>
      ) : null}

      {variant === "WORD_FROM_LETTERS" ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Слово</label>
            <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="привет" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Лишние буквы (слитно, необязательно)</label>
            <Input value={extraLetters} onChange={(e) => setExtraLetters(e.target.value)} placeholder="кмн" />
          </div>
        </div>
      ) : null}

      {variant === "SORT_COLUMNS" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Колонки (элементы через запятую)</label>
          {columns.map((col, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border p-2">
              <div className="flex flex-1 flex-col gap-2">
                <Input placeholder="Название колонки" value={col.title}
                  onChange={(e) => setColumns((prev) => prev.map((c, j) => (j === i ? { ...c, title: e.target.value } : c)))} />
                <Input placeholder="Элементы через запятую" value={col.itemsText}
                  onChange={(e) => setColumns((prev) => prev.map((c, j) => (j === i ? { ...c, itemsText: e.target.value } : c)))} />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={columns.length <= 2}
                onClick={() => setColumns((prev) => prev.filter((_, j) => j !== i))} aria-label="Удалить колонку">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setColumns((prev) => [...prev, { title: "", itemsText: "" }])}>
            <Plus className="h-4 w-4" />
            Колонка
          </Button>
        </div>
      ) : null}

      {variant === "MATCH_PAIRS" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Пары</label>
          {pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input placeholder="dog" value={pair.left}
                onChange={(e) => setPairs((prev) => prev.map((p, j) => (j === i ? { ...p, left: e.target.value } : p)))} />
              <span className="text-muted-foreground">—</span>
              <Input placeholder="собака" value={pair.right}
                onChange={(e) => setPairs((prev) => prev.map((p, j) => (j === i ? { ...p, right: e.target.value } : p)))} />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={pairs.length <= 1}
                onClick={() => setPairs((prev) => prev.filter((_, j) => j !== i))} aria-label="Удалить пару">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setPairs((prev) => [...prev, { left: "", right: "" }])}>
            <Plus className="h-4 w-4" />
            Пара
          </Button>
        </div>
      ) : null}

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
