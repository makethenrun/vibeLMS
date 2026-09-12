"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { addLessonAdjustmentAction } from "./actions";

export interface BalanceRow {
  id: string;
  name: string;
  login: string | null;
  paid: number;
  consumed: number;
  remaining: number;
}

export function LessonBalances({ rows, canManage }: { rows: BalanceRow[]; canManage: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q) || (r.login ?? "").toLowerCase().includes(q))
    : rows;

  async function adjust(id: string, sign: 1 | -1) {
    const n = Math.round(Number(amounts[id] ?? "1")) || 1;
    setBusy(id);
    const result = await addLessonAdjustmentAction(id, sign * Math.abs(n));
    setBusy(null);
    if (result.success) {
      toast.success(sign > 0 ? "Занятия начислены" : "Занятия списаны");
      setAmounts((prev) => ({ ...prev, [id]: "" }));
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по имени или логину" className="pl-8" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ученик</TableHead>
              <TableHead className="text-right">Оплачено</TableHead>
              <TableHead className="text-right">Проведено</TableHead>
              <TableHead className="text-right">Осталось</TableHead>
              {canManage ? <TableHead className="text-right">Корректировка</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center text-sm text-muted-foreground">
                  Ничего не найдено.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.name}
                    {r.login ? <span className="block text-xs text-muted-foreground">{r.login}</span> : null}
                  </TableCell>
                  <TableCell className="text-right">{r.paid}</TableCell>
                  <TableCell className="text-right">{r.consumed}</TableCell>
                  <TableCell className={cn("text-right font-semibold", r.remaining <= 0 && "text-destructive")}>
                    {r.remaining}
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          min={1}
                          value={amounts[r.id] ?? ""}
                          onChange={(e) => setAmounts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="1"
                          className="h-8 w-16"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={busy === r.id}
                          title="Начислить занятия"
                          onClick={() => adjust(r.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={busy === r.id}
                          title="Списать занятия"
                          onClick={() => adjust(r.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
