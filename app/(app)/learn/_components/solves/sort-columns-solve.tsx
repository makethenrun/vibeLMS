"use client";

import { useMemo, useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
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
}: {
  itemId: string;
  content: SentenceTaskContent;
  initialScore: number | null | undefined;
}) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const items = useMemo(() => shuffle(content.columns.flatMap((c) => c.items)), [content.columns]);
  const [value, setValue] = useState<Record<string, number>>({});

  async function onSubmit() {
    await submit({ assign: value } as unknown as Json);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>
      <ColumnsBoard columns={content.columns.map((c) => ({ title: c.title }))} items={items} value={value} onChange={setValue} disabled={locked} />
      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
