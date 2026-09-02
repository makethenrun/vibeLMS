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

function buildChips(tokens: string[], saved: string[] | undefined): Chip[] {
  const all = tokens.map((label, i) => ({ id: `t${i}`, label }));
  if (!saved || saved.length === 0) return shuffle(all);
  const used = new Set<string>();
  const result: Chip[] = [];
  for (const lbl of saved) {
    const c = all.find((x) => !used.has(x.id) && x.label === lbl);
    if (c) { used.add(c.id); result.push(c); }
  }
  for (const c of all) if (!used.has(c.id)) result.push(c);
  return result;
}

/** WORD_ORDER: order the words of one or more sentences; one submit for all. */
export function MultiOrderSolve({
  itemId,
  content,
  sentences,
  initialScore,
  initialAnswer,
}: {
  itemId: string;
  content: ItemContent;
  sentences: string[][];
  initialScore: number | null | undefined;
  initialAnswer?: { orders?: string[][] };
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const initial = useMemo(
    () => sentences.map((s, i) => buildChips(s, initialAnswer?.orders?.[i])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [chipsBySentence, setChipsBySentence] = useState<Chip[][]>(initial);

  async function onSubmit() {
    const orders = chipsBySentence.map((chips) => chips.map((c) => c.label));
    await submit({ orders } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>
      <p className="text-xs text-muted-foreground">
        {sentences.length > 1 ? "Расставьте слова в каждом предложении." : "Перетащите элементы в правильном порядке."}
      </p>
      {chipsBySentence.map((chips, i) => (
        <div key={i} className={sentences.length > 1 ? "rounded-md border p-3" : undefined}>
          {sentences.length > 1 ? <p className="mb-2 text-xs font-medium text-muted-foreground">Предложение {i + 1}</p> : null}
          <SortableChips
            chips={chips}
            onReorder={(next) => setChipsBySentence((prev) => prev.map((c, idx) => (idx === i ? next : c)))}
            disabled={locked}
            chipClass={(chip, idx) => feedbackClass(locked, isCorrect(chip.label, [sentences[i][idx] ?? ""]))}
          />
        </div>
      ))}
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
