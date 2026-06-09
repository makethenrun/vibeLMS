import type { Metadata } from "next";
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
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { formatCurrency } from "@/lib/utils";
import { getOverviewStatistics } from "@/services/statistics/statistics.service";

export const metadata: Metadata = { title: "Статистика" };

export default async function StatisticsPage() {
  await requireTutor();

  const db = createServerSupabaseClient();
  const stats = await getOverviewStatistics(db);

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
    </div>
  );
}
