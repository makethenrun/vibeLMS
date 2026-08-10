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

const CELL = "flex h-11 items-center rounded-md border bg-background px-3 text-sm";

interface Props {
  itemId: string;
  content: ItemContent;
  columns: string[];
  rows: string[][];
  initialScore: number | null | undefined;
  initialAnswer?: { table?: Record<string, string>; match?: Record<string, string> };
}

export function MatchColumnsSolve({ itemId, content, columns, rows, initialScore, initialAnswer }: Props) {
  const { score, saving, submit, locked } = useSubmit(itemId, initialScore);
  const targetCols = useMemo(() => columns.map((_, c) => c).filter((c) => c >= 1), [columns]);

  // One shuffled bank of chips per non-anchor column.
  const chipsByCol = useMemo<Record<number, Chip[]>>(() => {
    const map: Record<number, Chip[]> = {};
    for (const c of targetCols) {
      map[c] = shuffle(rows.map((row, r) => ({ id: `c${c}_${r}`, label: row[c] ?? "" })));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rows]);

  const [values, setValues] = useState<Record<number, Record<string, string>>>(() => {
    const initial: Record<number, Record<string, string>> = {};
    for (const c of targetCols) {
      const slots = rows.map((_, r) => ({
        slotId: `r${r}`,
        label: initialAnswer?.table?.[`${c}:${r}`] ?? (c === 1 ? initialAnswer?.match?.[String(r)] ?? "" : ""),
      }));
      initial[c] = assignByLabel(slots, chipsByCol[c]);
    }
    return initial;
  });

  function setColumnValue(c: number, next: Record<string, string>) {
    setValues((prev) => ({ ...prev, [c]: next }));
  }

  async function onSubmit() {
    const table: Record<string, string> = {};
    for (const c of targetCols) {
      const chipLabel = new Map(chipsByCol[c].map((ch) => [ch.id, ch.label]));
      rows.forEach((_, r) => {
        const chipId = values[c]?.[`r${r}`];
        table[`${c}:${r}`] = chipId ? chipLabel.get(chipId) ?? "" : "";
      });
    }
    await submit({ table } as unknown as Json, content);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ScoreBadge score={score} />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {/* Anchor column (fixed) */}
        <div className="space-y-2">
          <div className="h-7 text-xs font-medium text-muted-foreground">
            {columns[0] ? <FormattedText text={columns[0]} /> : " "}
          </div>
          {rows.map((row, r) => (
            <div key={r} className={`${CELL} font-medium`}>
              <FormattedText text={row[0] ?? ""} />
            </div>
          ))}
        </div>

        {/* Draggable columns */}
        {targetCols.map((c) => (
          <FillDnd key={c} chips={chipsByCol[c]} value={values[c] ?? {}} onChange={(v) => setColumnValue(c, v)} disabled={locked}>
            <div className="space-y-2">
              <div className="h-7 text-xs font-medium text-muted-foreground">
                {columns[c] ? <FormattedText text={columns[c]} /> : " "}
              </div>
              {rows.map((_, r) => (
                <DropSlot
                  key={r}
                  id={`r${r}`}
                  className={`${CELL} min-w-36 border-dashed`}
                  placeholder={<span className="text-xs text-muted-foreground">перетащите</span>}
                />
              ))}
              <div className="pt-2">
                <Bank className="flex-col items-stretch" chipClassName="justify-center" />
              </div>
            </div>
          </FillDnd>
        ))}
      </div>

      {!locked ? <LoadingButton size="sm" loading={saving} onClick={onSubmit}>Проверить</LoadingButton> : null}
    </div>
  );
}
