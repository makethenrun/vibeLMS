import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ClipboardX,
  TrendingUp,
  UsersRound,
  Video,
} from "lucide-react";

import { LessonStatusBadge } from "@/components/shared/lesson-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentStudent } from "@/lib/auth/current-user";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { formatDateTime } from "@/lib/utils";
import { getStudentDashboard, getTutorDashboard } from "@/services/statistics/statistics.service";
import type { LessonWithGroup } from "@/types";

export const metadata: Metadata = { title: "Дашборд" };

function UpcomingLessonsCard({ lessons }: { lessons: LessonWithGroup[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ближайшие занятия</CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет запланированных занятий.</p>
        ) : (
          <ul className="space-y-3">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(lesson.start_time)} · {lesson.groupName}
                  </p>
                </div>
                {lesson.meeting_url ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={lesson.meeting_url} target="_blank" rel="noopener noreferrer">
                      <Video className="h-3.5 w-3.5" />
                      Подключиться
                    </a>
                  </Button>
                ) : (
                  <LessonStatusBadge status={lesson.status} />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const db = createServerSupabaseClient();

  if (user.role === "TUTOR") {
    const data = await getTutorDashboard(db);
    return (
      <div className="space-y-6">
        <PageHeader title="Дашборд" description="Обзор вашей школы" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Учеников" value={data.stats.studentCount} icon={UsersRound} />
          <StatCard label="Групп" value={data.stats.groupCount} icon={UsersRound} />
          <StatCard label="Занятий на неделе" value={data.stats.lessonsThisWeek} icon={CalendarClock} />
          <StatCard
            label="ДЗ на проверке"
            value={data.stats.pendingSubmissions}
            icon={ClipboardList}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingLessonsCard lessons={data.upcomingLessons} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Последние сданные работы</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ещё нет сданных работ.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recentSubmissions.map((submission) => (
                    <li
                      key={submission.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{submission.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(submission.submitted_at)}
                        </p>
                      </div>
                      {submission.score !== null ? (
                        <Badge variant="success">{submission.score}</Badge>
                      ) : (
                        <Badge variant="secondary">На проверке</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const student = await getCurrentStudent();
  if (!student) {
    return (
      <div className="space-y-6">
        <PageHeader title="Дашборд" />
        <p className="text-sm text-muted-foreground">
          Профиль ученика не настроен. Обратитесь к преподавателю.
        </p>
      </div>
    );
  }

  const data = await getStudentDashboard(db, student.studentId);

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд" description={`Добро пожаловать, ${student.fullName}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Предстоящих занятий"
          value={data.stats.upcomingLessons}
          icon={CalendarClock}
          href="/lessons"
        />
        <StatCard
          label="Невыполненных ДЗ"
          value={data.stats.pendingHomework}
          icon={ClipboardX}
          href="/homework?status=pending"
        />
        <StatCard
          label="Выполненных ДЗ"
          value={data.stats.completedHomework}
          icon={CheckCircle2}
          href="/homework?status=done"
        />
        <StatCard
          label="Средний балл"
          value={data.stats.averageScore ?? "—"}
          icon={TrendingUp}
          href="/homework?status=done"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingLessonsCard lessons={data.upcomingLessons} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Задания к выполнению</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendingHomework.length === 0 ? (
              <p className="text-sm text-muted-foreground">Все задания выполнены 🎉</p>
            ) : (
              <ul className="space-y-3">
                {data.pendingHomework.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.lessonTitle}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/homework/${item.id}`}>Открыть</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
