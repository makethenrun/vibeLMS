"use client";

import { useMemo, useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
import type { ItemContent } from "@/lib/validators";
import type { Json } from "@/types";
import { Bank, DropSlot, FillDnd } from "../dnd/fill";
import type { Chip } from "../dnd/sortable-chips";
import { ScoreBadge } from "../score-badge";
import { useSubmit } from "../use-submit";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TILE = "inline-flex h-14 w-14 items-center justify-center rounded-lg text-lg font-semibold";

export function WordLettersSolve({
  itemId,
  content,
  word,
  extraLetters,
  initialScore,
}: {
  itemId: string;
  content: ItemContent;
  word: string;
  extraLetters: string;
  initialScore: number | null | undefined;
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const letters = useMemo(() => (word + extraLetters).split(""), [word, extraLetters]);
  const chips = useMemo<Chip[]>(() => shuffle(letters.map((label, i) => ({ id: `c${i}`, label }))), [letters]);
  const [value, setValue] = useState<Record<string, string>>({});
  const chipLabel = new Map(chips.map((c) => [c.id, c.label]));

  async function onSubmit() {
    const ordered = Array.from({ length: word.length }, (_, i) => {
      const chipId = value[`p${i}`];
      return chipId ? chipLabel.get(chipId) ?? "" : "";
    });
    await submit({ letters: ordered } as unknown as Json, content);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>

      <FillDnd chips={chips} value={value} onChange={setValue} disabled={locked}>
        <div className="flex flex-wrap justify-center gap-2 rounded-lg border bg-muted/30 p-4">
          {Array.from({ length: word.length }, (_, i) => (
            <DropSlot key={i} id={`p${i}`} className={`${TILE} border-2 border-dashed`} />
          ))}
        </div>
        <div className="mt-3">
          <Bank chipClassName={`${TILE} rounded-full`} />
        </div>
      </FillDnd>

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
