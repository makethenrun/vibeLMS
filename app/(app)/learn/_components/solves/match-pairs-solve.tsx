"use client";

import { useMemo, useState } from "react";

import { FormattedText } from "@/components/shared/formatted-text";
import { LoadingButton } from "@/components/shared/loading-button";
import type { ItemContent } from "@/lib/validators";
import type { Json } from "@/types";
import { assignByLabel, Bank, DropSlot, FillDnd } from "../dnd/fill";
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

// 300×300 rounded frame (matches image size).
const FRAME = "aspect-square w-full max-w-[300px] flex-col gap-2 rounded-2xl border text-lg font-semibold";

export function MatchPairsSolve({
  itemId,
  content,
  pairs,
  initialScore,
  initialAnswer,
}: {
  itemId: string;
  content: ItemContent;
  pairs: { left: string; right: string }[];
  initialScore: number | null | undefined;
  initialAnswer?: { match?: Record<string, string> };
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const chips = useMemo<Chip[]>(() => shuffle(pairs.map((p, i) => ({ id: `r${i}`, label: p.right }))), [pairs]);
  const [value, setValue] = useState<Record<string, string>>(() =>
    assignByLabel(
      pairs.map((_, i) => ({ slotId: `l${i}`, label: initialAnswer?.match?.[String(i)] ?? "" })),
      chips,
    ),
  );
  const chipLabel = new Map(chips.map((c) => [c.id, c.label]));

  async function onSubmit() {
    const match: Record<string, string> = {};
    pairs.forEach((_, i) => {
      const chipId = value[`l${i}`];
      match[String(i)] = chipId ? chipLabel.get(chipId) ?? "" : "";
    });
    await submit({ match } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>

      <FillDnd chips={chips} value={value} onChange={setValue} disabled={locked}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            {pairs.map((p, i) => (
              <DropSlot key={i} id={`l${i}`} className={`flex items-center justify-center ${FRAME}`}>
                <span><FormattedText text={p.left} /></span>
              </DropSlot>
            ))}
          </div>
          <Bank className="h-fit flex-col items-stretch gap-4 border-none p-0" chipClassName={`flex ${FRAME}`} />
        </div>
      </FillDnd>

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
