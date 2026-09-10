import type { Metadata } from "next";
import { Plus, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { requireManager } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { formatCurrency } from "@/lib/utils";
import { listPayments } from "@/services/payments/payments.service";
import { listStudents } from "@/services/students/students.service";
import { PaymentDialog } from "./payment-dialog";
import { PaymentsTable } from "./payments-table";

export const metadata: Metadata = { title: "Оплаты" };

export default async function PaymentsPage() {
  const user = await requireManager();
  const canManage = user.role === "TUTOR";

  const db = createServerSupabaseClient();
  const [payments, students] = await Promise.all([listPayments(db), listStudents(db)]);

  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const studentOptions = students.map((student) => ({ id: student.id, name: student.full_name }));
  const loginById = new Map(students.map((s) => [s.id, s.login] as const));
  const paymentRows = payments.map((p) => ({ ...p, studentLogin: loginById.get(p.student_id) ?? null }));

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
          canManage ? (studentOptions.length > 0 ? <PaymentDialog students={studentOptions} trigger={addButton} /> : addButton) : undefined
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
        <PaymentsTable payments={paymentRows} canManage={canManage} />
      )}
    </div>
  );
}
