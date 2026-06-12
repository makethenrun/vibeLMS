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
import { listMaterials } from "@/services/materials/materials.service";
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

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const db = createServerSupabaseClient();

  if (user.role === "TUTOR") {
    const [homework, lessons, materials] = await Promise.all([
      listHomeworkForTutor(db),
      listLessonOptions(db),
      listMaterials(db),
    ]);
    const materialOptions = materials.map((material) => ({
      id: material.id,
      title: material.title,
      fileUrl: material.file_url,
    }));

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
            lessons.length > 0 ? (
              <HomeworkDialog lessons={lessons} materials={materialOptions} trigger={addButton} />
            ) : (
              addButton
            )
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
                      <HomeworkActions id={item.id} title={item.title} lessons={lessons} />
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
  const allHomework = student ? await listHomeworkForStudent(db, student.studentId) : [];

  const { status } = await searchParams;
  const filter = status === "done" ? "done" : status === "pending" ? "pending" : "all";
  const homework = allHomework.filter((item) => {
    if (filter === "done") return item.submission !== null;
    if (filter === "pending") return item.submission === null;
    return true;
  });

  const tabs = [
    { key: "all", label: "Все", href: "/homework" },
    { key: "pending", label: "Невыполненные", href: "/homework?status=pending" },
    { key: "done", label: "Выполненные", href: "/homework?status=done" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Домашние задания" description="Ваши задания и тесты." />

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            asChild
            size="sm"
            variant={filter === tab.key ? "secondary" : "outline"}
          >
            <Link href={tab.href}>{tab.label}</Link>
          </Button>
        ))}
      </div>

      {homework.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Заданий нет"
          description="В этой категории заданий пока нет."
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
