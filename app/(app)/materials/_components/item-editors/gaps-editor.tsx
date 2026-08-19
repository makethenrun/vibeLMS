"use client";

import { useRef, useState } from "react";
import { RefreshCw, SquareDashedBottom } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { itemContentSchema, type GapsContent, type ItemContent } from "@/lib/validators";

type Mode = "INPUT" | "SELECT" | "DRAG";

interface BlankDraft {
  key: string;
  answersText: string;
  optionsText: string;
}

interface EditorProps {
  content: GapsContent;
  onSave: (content: ItemContent) => Promise<void>;
}

const GAP_RE = /\{\{([^{}]+)\}\}/g;

function keysInText(text: string): string[] {
  return [...new Set([...text.matchAll(GAP_RE)].map((m) => m[1].trim()))];
}

function toDraft(content: GapsContent): BlankDraft[] {
  return content.blanks.map((b) => ({
    key: String(b.index),
    answersText: b.answers.join(", "),
    optionsText: b.options ? b.options.join(", ") : "",
  }));
}

function parseList(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

export function GapsEditor({ content, onSave }: EditorProps) {
  const [mode, setMode] = useState<Mode>(content.mode ?? "INPUT");
  const [text, setText] = useState(content.text);
  const [blanks, setBlanks] = useState<BlankDraft[]>(toDraft(content));
  const [bankText, setBankText] = useState((content.bank ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function makeBlankFromSelection() {
    const ta = textRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.slice(start, end).trim();
    if (start === end || !selected) {
      toast.error("Выделите слово в тексте");
      return;
    }
    if (selected.includes("{") || selected.includes("}")) {
      toast.error("В пропуске не должно быть фигурных скобок");
      return;
    }
    setText(text.slice(0, start) + `{{${selected}}}` + text.slice(end));
    setBlanks((prev) =>
      prev.some((b) => b.key === selected) ? prev : [...prev, { key: selected, answersText: selected, optionsText: "" }],
    );
  }

  function syncFromText() {
    const keys = keysInText(text);
    setBlanks((prev) => {
      const byKey = new Map(prev.map((b) => [b.key, b]));
      return keys.map((key) => byKey.get(key) ?? { key, answersText: key, optionsText: "" });
    });
  }

  function updateBlank(key: string, patch: Partial<BlankDraft>) {
    setBlanks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  async function handleSave() {
    const candidate = {
      type: "GAPS" as const,
      mode,
      text,
      bank: mode === "DRAG" ? parseList(bankText) : [],
      blanks: blanks.map((b) => ({
        index: b.key,
        answers: parseList(b.answersText),
        options: mode === "SELECT" && parseList(b.optionsText).length > 0 ? parseList(b.optionsText) : null,
      })),
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
        <span className="text-sm font-medium">Режим:</span>
        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <SelectTrigger className="h-8 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INPUT">Ввод слова</SelectItem>
            <SelectItem value="SELECT">Выбор из списка</SelectItem>
            <SelectItem value="DRAG">Перетаскивание слова</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Текст с пропусками</label>
        <Textarea ref={textRef} value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        <p className="text-xs text-muted-foreground">
          Выделите слово и нажмите «Сделать пропуском» — оно превратится в <code>{"{{слово}}"}</code>. Можно вписывать маркеры вручную.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={makeBlankFromSelection}>
          <SquareDashedBottom className="h-4 w-4" />
          Сделать пропуском
        </Button>
        <Button size="sm" variant="outline" onClick={syncFromText}>
          <RefreshCw className="h-4 w-4" />
          Обновить пропуски из текста
        </Button>
      </div>

      {mode === "DRAG" ? (
        <div className="space-y-1">
          <label className="text-sm font-medium">Банк слов (через запятую)</label>
          <Input value={bankText} onChange={(e) => setBankText(e.target.value)} placeholder="went, saw, run, seen" />
          <p className="text-xs text-muted-foreground">
            Слова, которые ученик будет перетаскивать (включая правильные ответы и «лишние»).
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        {blanks.map((blank) => (
          <div key={blank.key} className="rounded-md border p-2">
            <p className="mb-2 text-sm font-medium">Пропуск {"{{"}{blank.key}{"}}"}</p>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Правильные ответы (через запятую)</label>
                <Input
                  value={blank.answersText}
                  onChange={(e) => updateBlank(blank.key, { answersText: e.target.value })}
                  placeholder="went, go (past)"
                />
              </div>
              {mode === "SELECT" ? (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Варианты для выбора (через запятую)</label>
                  <Input
                    value={blank.optionsText}
                    onChange={(e) => updateBlank(blank.key, { optionsText: e.target.value })}
                    placeholder="went, goed, gone"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
