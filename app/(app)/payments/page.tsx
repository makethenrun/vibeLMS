import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { getStudentOrNull, requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { formatCurrency } from "@/lib/utils";
import { listPayments, listPaymentsForStudent, listPendingPayments } from "@/services/payments/payments.service";
import { listStudents } from "@/services/students/students.service";
import { PaymentDialog } from "./payment-dialog";
import { PaymentsTable } from "./payments-table";
import { PendingPayments } from "./pending-payments";
import { StudentPayments } from "./student-payments";

export const metadata: Metadata = { title: "Оплаты" };

export default async function PaymentsPage() {
  const user = await requireUser();
  const db = createServerSupabaseClient();

  // Students see their own submission form and history.
  if (user.role === "STUDENT") {
    const student = await getStudentOrNull();
    const payments = student ? await listPaymentsForStudent(db, student.studentId) : [];
    return (
      <div className="space-y-6">
        <PageHeader title="Оплаты" description="Отметьте оплату — преподаватель подтвердит её." />
        <StudentPayments payments={payments} />
      </div>
    );
  }

  const isManager = user.role === "TUTOR" || user.role === "ADMINISTRATOR";
  if (!isManager) redirect("/dashboard");
  const canManage = user.role === "TUTOR";

  const [payments, students, pending] = await Promise.all([
    listPayments(db),
    listStudents(db),
    listPendingPayments(db),
  ]);

  const confirmedTotal = payments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
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
        actions={canManage ? (studentOptions.length > 0 ? <PaymentDialog students={studentOptions} trigger={addButton} /> : addButton) : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Подтверждённых записей" value={payments.filter((p) => p.status === "CONFIRMED").length} icon={Wallet} />
        <StatCard label="Подтверждённая сумма" value={formatCurrency(confirmedTotal)} icon={Wallet} />
      </div>

      <PendingPayments pending={pending} />

      {payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Оплат пока нет"
          description="Оплаты появятся, когда ученики отметят их, или добавьте вручную."
        />
      ) : (
        <PaymentsTable payments={paymentRows} canManage={canManage} />
      )}
    </div>
  );
}
