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

export function MatchPairsSolve({
  itemId,
  pairs,
  initialScore,
}: {
  itemId: string;
  pairs: { left: string; right: string }[];
  initialScore: number | null | undefined;
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const chips = useMemo<Chip[]>(() => shuffle(pairs.map((p, i) => ({ id: `r${i}`, label: p.right }))), [pairs]);
  const [value, setValue] = useState<Record<string, string>>({});
  const chipLabel = new Map(chips.map((c) => [c.id, c.label]));

  const slots = pairs.map((p, i) => ({ id: `l${i}`, node: <span className="text-sm font-medium">{p.left}</span> }));

  async function onSubmit() {
    const match: Record<string, string> = {};
    pairs.forEach((_, i) => {
      const chipId = value[`l${i}`];
      match[String(i)] = chipId ? chipLabel.get(chipId) ?? "" : "";
    });
    await submit({ match } as unknown as Json);
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
