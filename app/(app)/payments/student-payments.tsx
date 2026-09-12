"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types";
import { PaymentStatusBadge } from "./payment-status-badge";
import { createStudentPaymentAction } from "./actions";

export function StudentPayments({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [lessons, setLessons] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const result = await createStudentPaymentAction({ amount: Number(amount), lessons: Number(lessons) });
    setSaving(false);
    if (result.success) {
      toast.success("Отметка отправлена — ожидайте подтверждения");
      setAmount("");
      setLessons("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Отметить оплату</CardTitle>
          <p className="text-xs text-muted-foreground">Укажите сумму и количество занятий. Преподаватель подтвердит отметку.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Сумма</label>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3000" className="w-32" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Занятий</label>
            <Input type="number" min={1} value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="8" className="w-28" />
          </div>
          <LoadingButton loading={saving} disabled={!amount || !lessons} onClick={submit}>
            Отправить
          </LoadingButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Мои отметки</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Отметок пока нет.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Занятий</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.payment_date)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                    <TableCell>{p.lessons ?? "—"}</TableCell>
                    <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
