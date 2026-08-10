"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMatchTable, itemContentSchema, type ItemContent, type MatchContent } from "@/lib/validators";

interface EditorProps {
  content: MatchContent;
  onSave: (content: ItemContent) => Promise<void>;
}

const MIN_COLS = 2;
const MAX_COLS = 5;

export function MatchEditor({ content, onSave }: EditorProps) {
  const initial = getMatchTable(content);
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [columns, setColumns] = useState<string[]>(initial.columns.length >= MIN_COLS ? initial.columns : ["", ""]);
  const [rows, setRows] = useState<string[][]>(
    initial.rows.length > 0 ? initial.rows.map((r) => [...r]) : [Array(columns.length).fill("")],
  );
  const [saving, setSaving] = useState(false);

  function setHeader(c: number, value: string) {
    setColumns((prev) => prev.map((h, i) => (i === c ? value : h)));
  }

  function setCell(r: number, c: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? value : cell)) : row)));
  }

  function addColumn() {
    if (columns.length >= MAX_COLS) return;
    setColumns((prev) => [...prev, ""]);
    setRows((prev) => prev.map((row) => [...row, ""]));
  }

  function removeColumn(c: number) {
    if (columns.length <= MIN_COLS) return;
    setColumns((prev) => prev.filter((_, i) => i !== c));
    setRows((prev) => prev.map((row) => row.filter((_, i) => i !== c)));
  }

  function addRow() {
    setRows((prev) => [...prev, Array(columns.length).fill("")]);
  }

  function removeRow(r: number) {
    setRows((prev) => prev.filter((_, i) => i !== r));
  }

  async function handleSave() {
    const candidate = {
      type: "MATCH" as const,
      prompt: prompt.trim() || null,
      columns: columns.map((h) => h.trim()),
      rows: rows.map((row) => row.map((cell) => cell.trim())),
      pairs: [],
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
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Соотнесите слова и переводы" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Столбцы</label>
        <p className="text-xs text-muted-foreground">
          Первый столбец — опорный (остаётся на месте), остальные ученик перетаскивает. Например: слово, транскрипция, перевод.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {columns.map((header, c) => (
            <div key={c} className="flex items-center gap-1">
              <Input
                value={header}
                onChange={(e) => setHeader(c, e.target.value)}
                placeholder={`Столбец ${c + 1}`}
                className="h-8 w-40"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => removeColumn(c)}
                aria-label="Удалить столбец"
                disabled={columns.length <= MIN_COLS}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addColumn} disabled={columns.length >= MAX_COLS}>
            <Plus className="h-4 w-4" />
            Столбец
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Строки</label>
        {rows.map((row, r) => (
          <div key={r} className="flex flex-wrap items-center gap-2">
            {row.map((cell, c) => (
              <Input
                key={c}
                value={cell}
                onChange={(e) => setCell(r, c, e.target.value)}
                placeholder={columns[c]?.trim() || `Столбец ${c + 1}`}
                className="w-40"
              />
            ))}
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => removeRow(r)}
              aria-label="Удалить строку"
              disabled={rows.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4" />
          Строка
        </Button>
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
