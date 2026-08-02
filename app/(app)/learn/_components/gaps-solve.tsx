"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GapsContent } from "@/lib/validators";
import type { Json } from "@/types";
import { submitItemAction } from "../actions";
import { ScoreBadge } from "./score-badge";

interface GapsSolveProps {
  itemId: string;
  content: GapsContent;
  initialScore: number | null | undefined;
}

/** Splits "a {{1}} b {{2}}" into text + blank tokens in order. */
function tokenize(text: string): Array<{ text: string } | { blank: number }> {
  const out: Array<{ text: string } | { blank: number }> = [];
  const re = /\{\{(\d+)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ blank: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export function GapsSolve({ itemId, content, initialScore }: GapsSolveProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null | undefined>(initialScore);
  const [saving, setSaving] = useState(false);

  const tokens = tokenize(content.text);
  const blankById = new Map(content.blanks.map((b) => [b.index, b]));
  const locked = score !== undefined;

  async function submit() {
    setSaving(true);
    try {
      const answer: Json = { blanks: values } as unknown as Json;
      const result = await submitItemAction(itemId, answer);
      if (result.success) {
        setScore(result.data.score);
        toast.success("Ответ отправлен");
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>

      <p className="flex flex-wrap items-center gap-1 text-sm leading-8">
        {tokens.map((tok, i) => {
          if ("text" in tok) return <Fragment key={i}>{tok.text}</Fragment>;
          const blank = blankById.get(tok.blank);
          const key = String(tok.blank);
          if (content.mode === "SELECT" && blank?.options) {
            return (
              <Select
                key={i}
                value={values[key] ?? ""}
                onValueChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                disabled={locked}
              >
                <SelectTrigger className="inline-flex h-8 w-40">
                  <SelectValue placeholder="…" />
                </SelectTrigger>
                <SelectContent>
                  {blank.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return (
            <Input
              key={i}
              disabled={locked}
              value={values[key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              className="inline-flex h-8 w-32"
            />
          );
        })}
      </p>

      {!locked ? (
        <LoadingButton size="sm" loading={saving} onClick={submit}>
          Проверить
        </LoadingButton>
      ) : null}
    </div>
  );
}
