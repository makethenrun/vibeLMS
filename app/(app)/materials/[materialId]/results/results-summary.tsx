"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ResultRow {
  id: string;
  name: string;
  group: string;
  answered: number;
  total: number;
  avg: number | null;
  href: string;
}

export function ResultsSummary({ rows }: { rows: ResultRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.group.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск ученика…" className="pl-8" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ученик</TableHead>
            <TableHead>Группа</TableHead>
            <TableHead>Пройдено</TableHead>
            <TableHead>Средний балл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Ничего не найдено.</TableCell>
            </TableRow>
          ) : (
            filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={r.href} className="font-medium text-primary hover:underline">{r.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.group || "—"}</TableCell>
                <TableCell>{r.answered} / {r.total}</TableCell>
                <TableCell>{r.avg === null ? "—" : `${r.avg}%`}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
