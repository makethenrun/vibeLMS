"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DictionaryEntry } from "@/types";
import { moveEntriesLanguageAction } from "./actions";
import { EntryRow } from "./entry-row";

export function DictionaryTable({
  entries,
  enabledKeyboards = [],
  currentLanguage = null,
  languages = [],
}: {
  entries: DictionaryEntry[];
  enabledKeyboards?: string[];
  /** The language of the dictionary being shown (null = «Общий»). */
  currentLanguage?: string | null;
  /** All available study languages (for choosing a move target). */
  languages?: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);
  // Optimistic mirror so moved words leave this dictionary instantly.
  const [rows, setRows] = useState(entries);
  useEffect(() => setRows(entries), [entries]);

  // Targets a word can be moved to: every other dictionary (and «Общий»).
  const targets = useMemo<(string | null)[]>(() => {
    const list: (string | null)[] = languages.filter((l) => l !== currentLanguage);
    if (currentLanguage !== null) list.push(null); // allow moving back to «Общий»
    return list;
  }, [languages, currentLanguage]);
  const [target, setTarget] = useState<string>(() => (targets[0] ?? "") as string);
  const targetValue = (v: string | null) => v ?? "__null__";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((e) =>
      [e.term, e.pinyin, e.translation, e.note].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function cancelSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function move() {
    if (selected.size === 0) return toast.error("Выберите слова");
    const lang = target === "__null__" ? null : target;
    const ids = [...selected];
    const snapshot = rows;
    setRows(rows.filter((e) => !selected.has(e.id))); // optimistic: leave this tab
    cancelSelect();
    setMoving(true);
    const result = await moveEntriesLanguageAction(ids, lang);
    setMoving(false);
    if (result.success) {
      toast.success("Слова перенесены");
      router.refresh();
    } else {
      setRows(snapshot);
      toast.error(result.error);
    }
  }

  const colSpan = selectMode ? 6 : 5;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по слову, переводу…" className="pl-8" />
        </div>
        {selectMode ? (
          <>
            <span className="text-sm text-muted-foreground">Выбрано: {selected.size}</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              aria-label="Куда перенести"
            >
              {targets.map((t) => (
                <option key={targetValue(t)} value={targetValue(t)}>
                  {t ?? "Общий"}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={move} disabled={moving || selected.size === 0}>
              <ArrowRightLeft className="h-4 w-4" />
              Перенести
            </Button>
            <Button size="sm" variant="outline" onClick={cancelSelect} disabled={moving}>
              <X className="h-4 w-4" />
              Отмена
            </Button>
          </>
        ) : targets.length > 0 ? (
          <Button size="sm" variant="outline" onClick={() => setSelectMode(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            Перенести слова
          </Button>
        ) : null}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {selectMode ? <TableHead className="w-8" /> : null}
            <TableHead>Слово</TableHead>
            <TableHead>Транскрипция</TableHead>
            <TableHead>Перевод</TableHead>
            <TableHead>Заметка</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground">Ничего не найдено.</TableCell>
            </TableRow>
          ) : (
            filtered.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                enabledKeyboards={enabledKeyboards}
                selectable={selectMode}
                selected={selected.has(entry.id)}
                onToggle={toggle}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
