"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentWithStudent } from "@/types";
import { PaymentRowActions } from "./payment-row-actions";
import { PaymentStatusBadge } from "./payment-status-badge";

type Row = PaymentWithStudent & { studentLogin: string | null };

type SortKey = "date" | "student" | "amount" | "lessons" | "status";

export function PaymentsTable({ payments, canManage }: { payments: Row[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? payments.filter((p) => p.studentName.toLowerCase().includes(q) || (p.studentLogin ?? "").toLowerCase().includes(q))
    : payments;

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case "date":
          cmp = a.payment_date.localeCompare(b.payment_date) || a.created_at.localeCompare(b.created_at);
          break;
        case "student":
          cmp = a.studentName.localeCompare(b.studentName, "ru");
          break;
        case "amount":
          cmp = Number(a.amount) - Number(b.amount);
          break;
        case "lessons":
          cmp = (a.lessons ?? 0) - (b.lessons ?? 0);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [filtered, sort]);

  const SortHead = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {sort.key === k ? (
          sort.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );

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
              <SortHead label="Дата" k="date" />
              <SortHead label="Ученик" k="student" />
              <SortHead label="Сумма" k="amount" />
              <SortHead label="Занятий" k="lessons" />
              <SortHead label="Статус" k="status" />
              <TableHead className="hidden md:table-cell">Комментарий</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Ничего не найдено.</TableCell>
              </TableRow>
            ) : (
              sorted.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell className="font-medium">
                    {payment.studentName}
                    {payment.studentLogin ? <span className="block text-xs text-muted-foreground">{payment.studentLogin}</span> : null}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell>{payment.lessons ?? "—"}</TableCell>
                  <TableCell><PaymentStatusBadge status={payment.status} /></TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{payment.comment ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {canManage ? <PaymentRowActions id={payment.id} /> : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
