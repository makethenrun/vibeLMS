"use client";

import { useMemo, useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
import type { GapsContent } from "@/lib/validators";
import type { Json } from "@/types";
import { AssignBoard } from "../dnd/assign-board";
import type { Chip } from "../dnd/sortable-chips";
import { ScoreBadge } from "../score-badge";
import { useSubmit } from "../use-submit";

export function GapsDragSolve({ itemId, content, initialScore }: { itemId: string; content: GapsContent; initialScore: number | null | undefined }) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const chips = useMemo<Chip[]>(() => content.bank.map((label, i) => ({ id: `w${i}`, label })), [content.bank]);
  const [value, setValue] = useState<Record<string, string>>({});

  const chipLabel = new Map(chips.map((c) => [c.id, c.label]));
  const slots = content.blanks.map((b) => ({ id: `b${b.index}`, node: <span className="text-sm font-medium">Пропуск {b.index}</span> }));

  async function onSubmit() {
    const blanks: Record<string, string> = {};
    for (const b of content.blanks) {
      const chipId = value[`b${b.index}`];
      blanks[String(b.index)] = chipId ? chipLabel.get(chipId) ?? "" : "";
    }
    await submit({ blanks } as unknown as Json);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{content.text.replace(/\{\{(\d+)\}\}/g, "[$1]")}</p>
        <ScoreBadge score={score} />
      </div>
      <AssignBoard chips={chips} slots={slots} value={value} onChange={setValue} disabled={locked} />
      {!locked ? (
        <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton>
      ) : null}
    </div>
  );
}
