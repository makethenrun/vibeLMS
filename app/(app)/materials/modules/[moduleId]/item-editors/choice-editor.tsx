"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { itemContentSchema, type ChoiceContent, type ItemContent } from "@/lib/validators";
import type { GradingMode } from "@/types";

interface EditorProps {
  content: ChoiceContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function ChoiceEditor({ content, onSave }: EditorProps) {
  const [question, setQuestion] = useState(content.question);
  const [options, setOptions] = useState<string[]>(content.options);
  const [correct, setCorrect] = useState<number[]>(content.correct);
  const [multiple, setMultiple] = useState(content.multiple);
  const [grading, setGrading] = useState<GradingMode>(content.grading);
  const [saving, setSaving] = useState(false);

  function toggleCorrect(index: number) {
    if (multiple) {
      setCorrect((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
    } else {
      setCorrect([index]);
    }
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrect((prev) => prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  }

  async function handleSave() {
    const candidate = {
      type: "CHOICE" as const,
      question,
      options,
      correct: [...correct].sort((a, b) => a - b),
      multiple,
      grading,
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
        <label className="text-sm font-medium">Вопрос</label>
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Варианты</label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type={multiple ? "checkbox" : "radio"}
              name="correct"
              checked={correct.includes(index)}
              onChange={() => toggleCorrect(index)}
              aria-label="Правильный вариант"
            />
            <Input value={option} onChange={(e) => updateOption(index, e.target.value)} />
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => removeOption(index)}
              aria-label="Удалить вариант"
              disabled={options.length <= 2}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setOptions((prev) => [...prev, ""])}>
          <Plus className="h-4 w-4" />
          Вариант
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={multiple}
            onChange={(e) => {
              const next = e.target.checked;
              setMultiple(next);
              if (!next && correct.length > 1) setCorrect(correct.slice(0, 1));
            }}
          />
          Несколько правильных
        </label>

        {multiple ? (
          <div className="flex items-center gap-2 text-sm">
            <span>Оценка:</span>
            <Select value={grading} onValueChange={(v) => setGrading(v as GradingMode)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRICT">Строгая (всё или ничего)</SelectItem>
                <SelectItem value="PARTIAL">Частичная</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
