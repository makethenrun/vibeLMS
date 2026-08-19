"use client";

import { Fragment, useMemo, useState } from "react";

import { FormattedText } from "@/components/shared/formatted-text";
import { LoadingButton } from "@/components/shared/loading-button";
import { cn } from "@/lib/utils";
import { feedbackClass, isCorrect } from "@/lib/materials/answer-check";
import type { GapsContent } from "@/lib/validators";
import type { Json } from "@/types";
import { assignByLabel, Bank, DropSlot, FillDnd } from "../dnd/fill";
import type { Chip } from "../dnd/sortable-chips";
import { ScoreBadge } from "../score-badge";
import { useSubmit } from "../use-submit";

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

export function GapsDragSolve({
  itemId,
  content,
  initialScore,
  initialAnswer,
}: {
  itemId: string;
  content: GapsContent;
  initialScore: number | null | undefined;
  initialAnswer?: { blanks?: Record<string, string> };
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const chips = useMemo<Chip[]>(() => content.bank.map((label, i) => ({ id: `w${i}`, label })), [content.bank]);
  const [value, setValue] = useState<Record<string, string>>(() =>
    assignByLabel(
      content.blanks.map((b) => ({ slotId: `b${b.index}`, label: initialAnswer?.blanks?.[String(b.index)] ?? "" })),
      chips,
    ),
  );
  const chipLabel = new Map(chips.map((c) => [c.id, c.label]));
  const blankById = new Map(content.blanks.map((b) => [String(b.index), b]));
  const tokens = tokenize(content.text);

  async function onSubmit() {
    const blanks: Record<string, string> = {};
    for (const b of content.blanks) {
      const chipId = value[`b${b.index}`];
      blanks[String(b.index)] = chipId ? chipLabel.get(chipId) ?? "" : "";
    }
    await submit({ blanks } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>

      <FillDnd chips={chips} value={value} onChange={setValue} disabled={locked}>
        <p className="whitespace-pre-wrap text-base leading-[2.6]">
          {tokens.map((tok, i) =>
            "text" in tok ? (
              <Fragment key={i}><FormattedText text={tok.text} /></Fragment>
            ) : (
              <DropSlot
                key={i}
                id={`b${tok.blank}`}
                className={cn(
                  "inline-flex h-9 min-w-28 items-center justify-center rounded-md border-2 border-dashed px-1 align-middle",
                  feedbackClass(locked, isCorrect(chipLabel.get(value[`b${tok.blank}`] ?? ""), blankById.get(tok.blank)?.answers ?? [])),
                )}
                placeholder={<span className="text-sm text-muted-foreground">перетащите</span>}
              />
            ),
          )}
        </p>
        <div className="mt-4">
          <Bank />
        </div>
      </FillDnd>

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
