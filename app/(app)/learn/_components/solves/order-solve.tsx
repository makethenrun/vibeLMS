"use client";

import { useMemo, useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
import type { ItemContent } from "@/lib/validators";
import type { Json } from "@/types";
import { SortableChips, type Chip } from "../dnd/sortable-chips";
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

export function OrderSolve({
  itemId,
  content,
  tokens,
  initialScore,
}: {
  itemId: string;
  content: ItemContent;
  tokens: string[];
  initialScore: number | null | undefined;
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const initial = useMemo<Chip[]>(() => shuffle(tokens.map((label, i) => ({ id: `t${i}`, label }))), [tokens]);
  const [chips, setChips] = useState<Chip[]>(initial);

  async function onSubmit() {
    await submit({ order: chips.map((c) => c.label) } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>
      <p className="text-xs text-muted-foreground">Перетащите элементы в правильном порядке.</p>
      <SortableChips chips={chips} onReorder={setChips} disabled={locked} />
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
