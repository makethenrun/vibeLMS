"use client";

import { useMemo, useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
import { feedbackClass } from "@/lib/materials/answer-check";
import type { SentenceTaskContent } from "@/lib/validators";
import type { Json } from "@/types";
import { ColumnsBoard } from "../dnd/columns-board";
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

export function SortColumnsSolve({
  itemId,
  content,
  initialScore,
  initialAnswer,
}: {
  itemId: string;
  content: SentenceTaskContent;
  initialScore: number | null | undefined;
  initialAnswer?: { assign?: Record<string, number> };
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const items = useMemo(() => shuffle(content.columns.flatMap((c) => c.items)), [content.columns]);
  const correctColumn = useMemo(() => {
    const map = new Map<string, number>();
    content.columns.forEach((c, ci) => c.items.forEach((it) => map.set(it, ci)));
    return map;
  }, [content.columns]);
  const [value, setValue] = useState<Record<string, number>>(initialAnswer?.assign ?? {});

  async function onSubmit() {
    await submit({ assign: value } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>
      <ColumnsBoard
        columns={content.columns.map((c) => ({ title: c.title }))}
        items={items}
        value={value}
        onChange={setValue}
        disabled={locked}
        itemClass={(label) => feedbackClass(locked, value[label] === correctColumn.get(label))}
      />
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
