"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const MATCH_MIN_COLS = 2;
export const MATCH_MAX_COLS = 5;

/** Controlled editor for a match table: column headers + rows of cells. */
export function MatchTableFields({
  columns,
  rows,
  setColumns,
  setRows,
}: {
  columns: string[];
  rows: string[][];
  setColumns: (updater: (prev: string[]) => string[]) => void;
  setRows: (updater: (prev: string[][]) => string[][]) => void;
}) {
  function addColumn() {
    if (columns.length >= MATCH_MAX_COLS) return;
    setColumns((prev) => [...prev, ""]);
    setRows((prev) => prev.map((row) => [...row, ""]));
  }

  function removeColumn(c: number) {
    if (columns.length <= MATCH_MIN_COLS) return;
    setColumns((prev) => prev.filter((_, i) => i !== c));
    setRows((prev) => prev.map((row) => row.filter((_, i) => i !== c)));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Столбцы</label>
        <p className="text-xs text-muted-foreground">
          Первый столбец — опорный (остаётся на месте), остальные ученик перетаскивает. Например: слово, транскрипция, перевод.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {columns.map((header, c) => (
            <div key={c} className="flex items-center gap-1">
              <Input
                value={header}
                onChange={(e) => setColumns((prev) => prev.map((h, i) => (i === c ? e.target.value : h)))}
                placeholder={`Столбец ${c + 1}`}
                className="h-8 w-40"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => removeColumn(c)}
                aria-label="Удалить столбец"
                disabled={columns.length <= MATCH_MIN_COLS}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addColumn} disabled={columns.length >= MATCH_MAX_COLS}>
            <Plus className="h-4 w-4" />
            Столбец
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Строки</label>
        {rows.map((row, r) => (
          <div key={r} className="flex flex-wrap items-center gap-2">
            {row.map((cell, c) => (
              <Input
                key={c}
                value={cell}
                onChange={(e) =>
                  setRows((prev) => prev.map((rr, i) => (i === r ? rr.map((cc, j) => (j === c ? e.target.value : cc)) : rr)))
                }
                placeholder={columns[c]?.trim() || `Столбец ${c + 1}`}
                className="w-40"
              />
            ))}
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== r))}
              aria-label="Удалить строку"
              disabled={rows.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setRows((prev) => [...prev, Array(columns.length).fill("")])}>
          <Plus className="h-4 w-4" />
          Строка
        </Button>
      </div>
    </div>
  );
}
