"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DictionaryEntry } from "@/types";
import { EntryRow } from "./entry-row";

export function DictionaryTable({ entries }: { entries: DictionaryEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.term, e.pinyin, e.translation, e.note].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [entries, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по слову, переводу…" className="pl-8" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Ничего не найдено.</TableCell>
            </TableRow>
          ) : (
            filtered.map((entry) => <EntryRow key={entry.id} entry={entry} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
