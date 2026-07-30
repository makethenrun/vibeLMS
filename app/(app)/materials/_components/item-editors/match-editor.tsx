"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemContentSchema, type ItemContent, type MatchContent } from "@/lib/validators";

interface EditorProps {
  content: MatchContent;
  onSave: (content: ItemContent) => Promise<void>;
}

interface PairDraft {
  left: string;
  right: string;
}

export function MatchEditor({ content, onSave }: EditorProps) {
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [pairs, setPairs] = useState<PairDraft[]>(content.pairs.map((p) => ({ ...p })));
  const [saving, setSaving] = useState(false);

  function updatePair(index: number, patch: Partial<PairDraft>) {
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  async function handleSave() {
    const candidate = {
      type: "MATCH" as const,
      prompt: prompt.trim() || null,
      pairs,
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Пары</label>
        {pairs.map((pair, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={pair.left}
              onChange={(e) => updatePair(index, { left: e.target.value })}
              placeholder="dog"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              value={pair.right}
              onChange={(e) => updatePair(index, { right: e.target.value })}
              placeholder="собака"
            />
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => setPairs((prev) => prev.filter((_, i) => i !== index))}
              aria-label="Удалить пару"
              disabled={pairs.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setPairs((prev) => [...prev, { left: "", right: "" }])}>
          <Plus className="h-4 w-4" />
          Пара
        </Button>
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
