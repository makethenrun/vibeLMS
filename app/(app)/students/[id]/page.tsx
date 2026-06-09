import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { listGroupsForStudent } from "@/services/groups/groups.service";
import { getStudentPaidTotal, listPaymentsForStudent } from "@/services/payments/payments.service";
import { getStudent } from "@/services/students/students.service";
import { StudentActions } from "./student-actions";

export const metadata: Metadata = { title: "Ученик" };

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTutor();
  const { id } = await params;

  const db = createServerSupabaseClient();
  const student = await getStudent(db, id);
  if (!student) notFound();

  const [groups, payments, paidTotal] = await Promise.all([
    listGroupsForStudent(db, id),
    listPaymentsForStudent(db, id),
    getStudentPaidTotal(db, id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.full_name}
        description="Профиль ученика"
        actions={<StudentActions student={student} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Статус</span>
              {student.is_archived ? (
                <Badge variant="outline">В архиве</Badge>
              ) : (
                <Badge variant="success">Активен</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Логин</span>
              <span>{student.login ?? "нет доступа"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Добавлен</span>
              <span>{formatDate(student.created_at)}</span>
            </div>
            <div className="space-y-1 pt-2">
              <span className="text-muted-foreground">Заметки</span>
              <p className="whitespace-pre-wrap">
                {student.notes ?? "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Группы</CardTitle>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ученик не состоит ни в одной группе.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <Badge key={group.id} variant="secondary">
                    {group.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>История оплат</CardTitle>
            <span className="text-sm text-muted-foreground">
              Всего: <span className="font-semibold text-foreground">{formatCurrency(paidTotal)}</span>
            </span>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Оплат пока нет.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(payment.amount))}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.comment ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
