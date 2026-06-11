import type { Metadata } from "next";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  ClipboardX,
  Percent,
  UsersRound,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { formatCurrency } from "@/lib/utils";
import {
  getOverviewStatistics,
  getPaymentStatistics,
  type PaymentBreakdownItem,
} from "@/services/statistics/statistics.service";

export const metadata: Metadata = { title: "Статистика" };

function formatMonth(label: string): string {
  const date = new Date(`${label}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) return label;
  return format(date, "LLLL yyyy", { locale: ru });
}

function BreakdownList({
  items,
  formatLabel,
}: {
  items: PaymentBreakdownItem[];
  formatLabel?: (label: string) => string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex items-center justify-between gap-3">
          <span className="truncate capitalize">
            {formatLabel ? formatLabel(item.label) : item.label}
          </span>
          <span className="shrink-0 font-medium tabular-nums">{formatCurrency(item.total)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function StatisticsPage() {
  await requireTutor();

  const db = createServerSupabaseClient();
  const [stats, paymentStats] = await Promise.all([
    getOverviewStatistics(db),
    getPaymentStatistics(db),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Статистика" description="Сводка по занятиям, заданиям и оплатам." />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Занятия</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Всего занятий" value={stats.totalLessons} icon={CalendarDays} />
          <StatCard label="Проведено" value={stats.completedLessons} icon={CalendarCheck} />
          <StatCard label="Отменено" value={stats.cancelledLessons} icon={CalendarX} />
          <StatCard
            label="Посещаемость"
            value={`${stats.attendanceRate}%`}
            icon={Percent}
            hint="Проведённые из завершённых занятий"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Домашние задания</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Всего заданий" value={stats.totalHomework} icon={ClipboardList} />
          <StatCard label="Выполнено" value={stats.submittedHomework} icon={CheckCircle2} />
          <StatCard label="Не выполнено" value={stats.pendingHomework} icon={ClipboardX} />
          <StatCard label="Проверено" value={stats.gradedHomework} icon={ClipboardCheck} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Общее</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Активных учеников" value={stats.totalStudents} icon={UsersRound} />
          <StatCard label="Сумма оплат" value={formatCurrency(stats.totalPaid)} icon={Wallet} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Оплаты</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">По месяцам</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={paymentStats.byMonth} formatLabel={formatMonth} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">По группам</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={paymentStats.byGroup} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">По ученикам (топ-10)</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList items={paymentStats.byStudent} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
