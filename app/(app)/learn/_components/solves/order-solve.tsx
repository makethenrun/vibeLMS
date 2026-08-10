"use client";

import { useMemo, useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
import { feedbackClass, isCorrect } from "@/lib/materials/answer-check";
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
  initialAnswer,
  vertical = false,
}: {
  itemId: string;
  content: ItemContent;
  tokens: string[];
  initialScore: number | null | undefined;
  initialAnswer?: { order?: string[] };
  vertical?: boolean;
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const initial = useMemo<Chip[]>(() => {
    const all = tokens.map((label, i) => ({ id: `t${i}`, label }));
    const order = initialAnswer?.order;
    if (!order?.length) return shuffle(all);
    const used = new Set<string>();
    const result: Chip[] = [];
    for (const lbl of order) {
      const c = all.find((x) => !used.has(x.id) && x.label === lbl);
      if (c) { used.add(c.id); result.push(c); }
    }
    for (const c of all) if (!used.has(c.id)) result.push(c);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);
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
      <SortableChips
        chips={chips}
        onReorder={setChips}
        disabled={locked}
        vertical={vertical}
        chipClass={(chip, i) => feedbackClass(locked, isCorrect(chip.label, [tokens[i] ?? ""]))}
      />
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
