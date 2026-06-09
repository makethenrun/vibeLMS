import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HOMEWORK_TYPE_LABELS } from "@/lib/constants";
import { getCurrentStudent } from "@/lib/auth/current-user";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { formatDateTime } from "@/lib/utils";
import {
  listHomeworkForStudent,
  listHomeworkForTutor,
} from "@/services/homework/homework.service";
import { listLessonOptions } from "@/services/lessons/lessons.service";
import type { StudentHomeworkItem } from "@/types";
import { HomeworkActions } from "./homework-actions";
import { HomeworkDialog } from "./homework-dialog";

export const metadata: Metadata = { title: "Домашние задания" };

function StudentSubmissionBadge({ item }: { item: StudentHomeworkItem }) {
  if (!item.submission) return <Badge variant="outline">Не сдано</Badge>;
  if (item.submission.score !== null) {
    return <Badge variant="success">Оценка: {item.submission.score}</Badge>;
  }
  return <Badge variant="secondary">На проверке</Badge>;
}

export default async function HomeworkPage() {
  const user = await requireUser();
  const db = createServerSupabaseClient();

  if (user.role === "TUTOR") {
    const [homework, lessons] = await Promise.all([
      listHomeworkForTutor(db),
      listLessonOptions(db),
    ]);

    const addButton = (
      <Button disabled={lessons.length === 0}>
        <Plus className="h-4 w-4" />
        Создать задание
      </Button>
    );

    return (
      <div className="space-y-6">
        <PageHeader
          title="Домашние задания"
          description="Задания и тесты, привязанные к занятиям."
          actions={
            lessons.length > 0 ? <HomeworkDialog lessons={lessons} trigger={addButton} /> : addButton
          }
        />

        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Сначала создайте занятие — задания привязываются к занятиям.
          </p>
        ) : null}

        {homework.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Пока нет заданий"
            description="Создайте задание типа «Файл» или «Тест»."
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead className="hidden md:table-cell">Занятие</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="hidden lg:table-cell">Дедлайн</TableHead>
                  <TableHead>Ответы</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {homework.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Link href={`/homework/${item.id}`} className="hover:underline">
                        {item.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {item.lessonTitle} · {item.groupName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === "QUIZ" ? "default" : "secondary"}>
                        {HOMEWORK_TYPE_LABELS[item.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {item.deadline ? formatDateTime(item.deadline) : "—"}
                    </TableCell>
                    <TableCell>{item.submissionCount}</TableCell>
                    <TableCell className="text-right">
                      <HomeworkActions id={item.id} title={item.title} />
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

  const student = await getCurrentStudent();
  const homework = student ? await listHomeworkForStudent(db, student.studentId) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Домашние задания" description="Ваши задания и тесты." />

      {homework.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Заданий пока нет"
          description="Здесь появятся задания по вашим занятиям."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {homework.map((item) => (
            <Card key={item.id}>
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link href={`/homework/${item.id}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </CardTitle>
                  <Badge variant={item.type === "QUIZ" ? "default" : "secondary"}>
                    {HOMEWORK_TYPE_LABELS[item.type]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.lessonTitle} · {item.groupName}
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <StudentSubmissionBadge item={item} />
                <Button asChild size="sm" variant="outline">
                  <Link href={`/homework/${item.id}`}>Открыть</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
