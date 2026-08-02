"use client";

import { useMemo, useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
import type { Json } from "@/types";
import { AssignBoard } from "../dnd/assign-board";
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

export function WordLettersSolve({
  itemId,
  word,
  extraLetters,
  initialScore,
}: {
  itemId: string;
  word: string;
  extraLetters: string;
  initialScore: number | null | undefined;
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const letters = useMemo(() => (word + extraLetters).split(""), [word, extraLetters]);
  const chips = useMemo<Chip[]>(() => shuffle(letters.map((label, i) => ({ id: `c${i}`, label }))), [letters]);
  const [value, setValue] = useState<Record<string, string>>({});
  const chipLabel = new Map(chips.map((c) => [c.id, c.label]));

  const slots = Array.from({ length: word.length }, (_, i) => ({
    id: `p${i}`,
    node: <span className="text-xs text-muted-foreground">буква {i + 1}</span>,
  }));

  async function onSubmit() {
    const ordered = slots.map((s) => {
      const chipId = value[s.id];
      return chipId ? chipLabel.get(chipId) ?? "" : "";
    });
    await submit({ letters: ordered } as unknown as Json);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>
      <AssignBoard chips={chips} slots={slots} value={value} onChange={setValue} disabled={locked} />
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
