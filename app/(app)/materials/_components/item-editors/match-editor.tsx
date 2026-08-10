"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Input } from "@/components/ui/input";
import { getMatchTable, itemContentSchema, type ItemContent, type MatchContent } from "@/lib/validators";
import { MATCH_MIN_COLS, MatchTableFields } from "./match-table-fields";

interface EditorProps {
  content: MatchContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function MatchEditor({ content, onSave }: EditorProps) {
  const initial = getMatchTable(content);
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [columns, setColumns] = useState<string[]>(initial.columns.length >= MATCH_MIN_COLS ? initial.columns : ["", ""]);
  const [rows, setRows] = useState<string[][]>(
    initial.rows.length > 0 ? initial.rows.map((r) => [...r]) : [Array(columns.length).fill("")],
  );
  const [saving, setSaving] = useState(false);

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

      <MatchTableFields columns={columns} rows={rows} setColumns={setColumns} setRows={setRows} />

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
