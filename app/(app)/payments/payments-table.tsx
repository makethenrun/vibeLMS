"use client";

import { useState } from "react";
import { Search } from "lucide-react";

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

type Row = PaymentWithStudent & { studentLogin: string | null };

export function PaymentsTable({ payments, canManage }: { payments: Row[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? payments.filter((p) => p.studentName.toLowerCase().includes(q) || (p.studentLogin ?? "").toLowerCase().includes(q))
    : payments;

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
              <TableHead>Дата</TableHead>
              <TableHead>Ученик</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead className="hidden md:table-cell">Комментарий</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Ничего не найдено.</TableCell>
              </TableRow>
            ) : (
              filtered.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell className="font-medium">
                    {payment.studentName}
                    {payment.studentLogin ? <span className="block text-xs text-muted-foreground">{payment.studentLogin}</span> : null}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
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
