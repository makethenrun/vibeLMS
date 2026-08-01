"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
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
  index: number;
  answersText: string;
  optionsText: string;
}

interface EditorProps {
  content: GapsContent;
  onSave: (content: ItemContent) => Promise<void>;
}

function toDraft(content: GapsContent): BlankDraft[] {
  return content.blanks.map((b) => ({
    index: b.index,
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

  function syncFromText() {
    const indices = [...new Set([...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
    setBlanks((prev) => {
      const byIndex = new Map(prev.map((b) => [b.index, b]));
      return indices.map((index) => byIndex.get(index) ?? { index, answersText: "", optionsText: "" });
    });
  }

  function updateBlank(index: number, patch: Partial<BlankDraft>) {
    setBlanks((prev) => prev.map((b) => (b.index === index ? { ...b, ...patch } : b)));
  }

  async function handleSave() {
    const candidate = {
      type: "GAPS" as const,
      mode,
      text,
      bank: mode === "DRAG" ? parseList(bankText) : [],
      blanks: blanks.map((b) => ({
        index: b.index,
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
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        <p className="text-xs text-muted-foreground">
          Отмечайте пропуски маркерами <code>{"{{1}}"}</code>, <code>{"{{2}}"}</code> и т.д.
        </p>
      </div>

      <Button size="sm" variant="outline" onClick={syncFromText}>
        <RefreshCw className="h-4 w-4" />
        Обновить пропуски из текста
      </Button>

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
          <div key={blank.index} className="rounded-md border p-2">
            <p className="mb-2 text-sm font-medium">Пропуск {"{{"}{blank.index}{"}}"}</p>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Правильные ответы (через запятую)</label>
                <Input
                  value={blank.answersText}
                  onChange={(e) => updateBlank(blank.index, { answersText: e.target.value })}
                  placeholder="went, go (past)"
                />
              </div>
              {mode === "SELECT" ? (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Варианты для выбора (через запятую)</label>
                  <Input
                    value={blank.optionsText}
                    onChange={(e) => updateBlank(blank.index, { optionsText: e.target.value })}
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
