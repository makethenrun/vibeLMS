"use client";

import { Fragment, useState } from "react";

import { Input } from "@/components/ui/input";
import { FormattedText } from "@/components/shared/formatted-text";
import { LoadingButton } from "@/components/shared/loading-button";
import { cn } from "@/lib/utils";
import { feedbackClass, isCorrect } from "@/lib/materials/answer-check";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GapsContent } from "@/lib/validators";
import type { Json } from "@/types";
import { ScoreBadge } from "./score-badge";
import { useSubmit } from "./use-submit";

interface GapsSolveProps {
  itemId: string;
  content: GapsContent;
  initialScore: number | null | undefined;
  initialAnswer?: { blanks?: Record<string, string> };
}

function tokenize(text: string): Array<{ text: string } | { blank: string }> {
  const out: Array<{ text: string } | { blank: string }> = [];
  const re = /\{\{([^{}]+)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ blank: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export function GapsSolve({ itemId, content, initialScore, initialAnswer }: GapsSolveProps) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const [values, setValues] = useState<Record<string, string>>(initialAnswer?.blanks ?? {});

  const tokens = tokenize(content.text);
  const blankById = new Map(content.blanks.map((b) => [String(b.index), b]));

  async function onSubmit() {
    await submit({ blanks: values } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>

      <p className="whitespace-pre-wrap text-sm leading-[2.4]">
        {tokens.map((tok, i) => {
          if ("text" in tok) return <Fragment key={i}><FormattedText text={tok.text} /></Fragment>;
          const blank = blankById.get(tok.blank);
          const key = String(tok.blank);
          const ok = blank ? isCorrect(values[key], blank.answers) : false;
          if (content.mode === "SELECT" && blank?.options) {
            return (
              <Select
                key={i}
                value={values[key] ?? ""}
                onValueChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                disabled={locked}
              >
                <SelectTrigger className={cn("inline-flex h-8 w-40 border-2 border-primary/60 bg-primary/5 align-middle", feedbackClass(locked, ok))}>
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
              className={cn("inline-flex h-8 w-32 border-2 border-primary/60 bg-primary/5 align-middle", feedbackClass(locked, ok))}
            />
          );
        })}
      </p>

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
