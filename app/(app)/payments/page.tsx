import type { Metadata } from "next";
import { Plus, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listPayments } from "@/services/payments/payments.service";
import { listStudents } from "@/services/students/students.service";
import { PaymentDialog } from "./payment-dialog";
import { PaymentRowActions } from "./payment-row-actions";

export const metadata: Metadata = { title: "Оплаты" };

export default async function PaymentsPage() {
  await requireTutor();

  const db = createServerSupabaseClient();
  const [payments, students] = await Promise.all([listPayments(db), listStudents(db)]);

  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const studentOptions = students.map((student) => ({ id: student.id, name: student.full_name }));

  const addButton = (
    <Button disabled={studentOptions.length === 0}>
      <Plus className="h-4 w-4" />
      Добавить оплату
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Оплаты"
        description="Учёт платежей учеников."
        actions={
          studentOptions.length > 0 ? (
            <PaymentDialog students={studentOptions} trigger={addButton} />
          ) : (
            addButton
          )
        }
      />

      {studentOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Сначала добавьте учеников.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Всего записей" value={payments.length} icon={Wallet} />
        <StatCard label="Общая сумма" value={formatCurrency(total)} icon={Wallet} />
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Оплат пока нет"
          description="Добавьте первую оплату, чтобы вести историю платежей."
        />
      ) : (
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
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell className="font-medium">{payment.studentName}</TableCell>
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {payment.comment ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <PaymentRowActions id={payment.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
