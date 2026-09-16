"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormattedText } from "@/components/shared/formatted-text";
import type { GrammarEntry } from "@/types";
import { GrammarDialog } from "./grammar-dialog";
import { deleteGrammarAction } from "./actions";

/** Grammar reference: browse blocks as a carousel, with search. Staff can manage. */
export function GrammarBrowser({ entries, canManage }: { entries: GrammarEntry[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q));
  }, [entries, query]);

  useEffect(() => {
    setIndex(0);
  }, [query, entries.length]);

  const idx = Math.min(index, Math.max(0, filtered.length - 1));
  const current = filtered[idx];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по справочнику" className="pl-8" />
        </div>
        {canManage ? (
          <GrammarDialog
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Добавить блок
              </Button>
            }
          />
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {entries.length === 0 ? "Справочник пока пуст." : "Ничего не найдено."}
        </p>
      ) : current ? (
        <div className="rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b p-3">
            <h2 className="text-base font-semibold"><FormattedText text={current.title} /></h2>
            {canManage ? (
              <div className="flex shrink-0 gap-1">
                <GrammarDialog
                  entry={current}
                  trigger={<Button size="icon" variant="ghost" aria-label="Редактировать"><Pencil className="h-4 w-4" /></Button>}
                />
                <ConfirmDialog
                  trigger={<Button size="icon" variant="ghost" className="text-destructive" aria-label="Удалить"><Trash2 className="h-4 w-4" /></Button>}
                  title="Удалить блок?"
                  description={`«${current.title}» будет удалён.`}
                  confirmLabel="Удалить"
                  variant="destructive"
                  successMessage="Удалено"
                  action={() => deleteGrammarAction(current.id)}
                />
              </div>
            ) : null}
          </div>
          <div className="min-h-[8rem] whitespace-pre-wrap p-4 text-sm leading-relaxed">
            {current.body ? <FormattedText text={current.body} /> : <span className="text-muted-foreground">Пусто.</span>}
          </div>
          <div className="flex items-center justify-between border-t p-3">
            <Button size="sm" variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={idx === 0}>
              <ChevronLeft className="h-4 w-4" />
              Назад
            </Button>
            <span className="text-xs text-muted-foreground">{idx + 1} из {filtered.length}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIndex((i) => Math.min(filtered.length - 1, i + 1))}
              disabled={idx >= filtered.length - 1}
            >
              Вперёд
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
