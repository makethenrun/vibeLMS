"use client";

import { useEffect, useReducer } from "react";
import { toast } from "sonner";
import { Copy, Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clearRecords, getRecords, subscribe, type LatencyRecord } from "@/lib/dev/latency-store";

function timeOf(ts: string): string {
  const d = new Date(ts);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

function num(v: number | null): string {
  return v === null || v === undefined ? "—" : String(v);
}

export function LatencyHistory({ compact = false }: { compact?: boolean }) {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribe(() => force()), []);

  const records = getRecords();
  const rows = records.map((r, i) => ({ n: i + 1, r }));

  function copy() {
    void navigator.clipboard
      .writeText(JSON.stringify(records, null, 2))
      .then(() => toast.success(`Скопировано записей: ${records.length}`))
      .catch(() => toast.error("Не удалось скопировать"));
  }

  function download() {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `latency-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clear() {
    if (window.confirm("Очистить всю историю откликов?")) clearRecords();
  }

  const maxH = compact ? "max-h-56" : "max-h-80";

  return (
    <div className="space-y-3" data-latency-ui>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Записей: {records.length}</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={copy} disabled={records.length === 0}>
            <Copy className="h-4 w-4" /> Копировать JSON
          </Button>
          <Button size="sm" variant="outline" onClick={download} disabled={records.length === 0}>
            <Download className="h-4 w-4" /> Скачать
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={clear} disabled={records.length === 0}>
            <Trash2 className="h-4 w-4" /> Очистить
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold">Время отклика (мс)</p>
        <div className={`overflow-auto rounded-md border ${maxH}`}>
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Время</TableHead>
                <TableHead className="text-right">Кадр</TableHead>
                <TableHead className="text-right">Input delay</TableHead>
                <TableHead className="text-right">Обработка</TableHead>
                <TableHead className="text-right">Всего</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground">Пока нет данных.</TableCell></TableRow>
              ) : (
                rows.map(({ n, r }) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{n}</TableCell>
                    <TableCell className="font-mono text-xs">{timeOf(r.ts)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.rafMs}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(r.inputDelayMs)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(r.processingMs)}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${(r.durationMs ?? 0) >= 200 ? "text-destructive" : (r.durationMs ?? 0) >= 100 ? "text-yellow-600" : ""}`}>{num(r.durationMs)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold">Куда нажималось</p>
        <div className={`overflow-auto rounded-md border ${maxH}`}>
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Время</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Страница</TableHead>
                <TableHead>Элемент</TableHead>
                <TableHead>Коорд.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground">Пока нет данных.</TableCell></TableRow>
              ) : (
                rows.map(({ n, r }) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{n}</TableCell>
                    <TableCell className="font-mono text-xs">{timeOf(r.ts)}</TableCell>
                    <TableCell className="text-xs">{r.role || "—"}</TableCell>
                    <TableCell className="max-w-[10rem] truncate text-xs" title={r.path}>{r.path}</TableCell>
                    <TableCell className="max-w-[14rem] truncate text-xs" title={describe(r)}>{describe(r)}</TableCell>
                    <TableCell className="text-xs tabular-nums">{r.x},{r.y}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function describe(r: LatencyRecord): string {
  const parts = [r.tag];
  if (r.text) parts.push(`«${r.text}»`);
  else if (r.aria) parts.push(`[${r.aria}]`);
  if (r.elId) parts.push(`#${r.elId}`);
  return parts.join(" ");
}
