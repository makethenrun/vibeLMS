"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  UserCheck,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LessonStatusBadge } from "@/components/shared/lesson-status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LessonStatus } from "@/lib/db/database.types";
import { formatTime } from "@/lib/utils";
import type { LessonWithGroup } from "@/types";
import { deleteLessonAction, setLessonStatusAction } from "./actions";
import { AttendanceDialog } from "./attendance-dialog";
import { LessonDialog } from "./lesson-dialog";

interface GroupOption {
  id: string;
  name: string;
}

interface LessonCardProps {
  lesson: LessonWithGroup;
  isTutor: boolean;
  groups: GroupOption[];
}

export function LessonCard({ lesson, isTutor, groups }: LessonCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function changeStatus(status: LessonStatus, message: string) {
    startTransition(async () => {
      const result = await setLessonStatusAction(lesson.id, status);
      if (result.success) {
        toast.success(message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="rounded-md border bg-background p-2 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium tabular-nums">
          {formatTime(lesson.start_time)}–{formatTime(lesson.end_time)}
        </span>
        {isTutor ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-1 h-6 w-6" disabled={isPending}>
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Действия</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAttendanceOpen(true)}>
                <UserCheck className="h-4 w-4" />
                Присутствующие
              </DropdownMenuItem>
              {lesson.status !== "COMPLETED" ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    changeStatus("COMPLETED", "Занятие отмечено проведённым");
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Отметить проведённым
                </DropdownMenuItem>
              ) : null}
              {lesson.status !== "CANCELLED" ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    changeStatus("CANCELLED", "Занятие отменено");
                  }}
                >
                  <Ban className="h-4 w-4" />
                  Отменить
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    changeStatus("SCHEDULED", "Занятие восстановлено");
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Вернуть в расписание
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <p className="mt-0.5 font-medium leading-tight">{lesson.title}</p>
      <p className="text-xs text-muted-foreground">{lesson.groupName}</p>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5">
        <LessonStatusBadge status={lesson.status} />
        {lesson.meeting_url && lesson.status !== "CANCELLED" ? (
          <Button asChild size="sm" variant="outline" className="h-7 px-2">
            <a href={lesson.meeting_url} target="_blank" rel="noopener noreferrer">
              <Video className="h-3.5 w-3.5" />
              Подключиться
            </a>
          </Button>
        ) : null}
      </div>

      {isTutor ? (
        <>
          <LessonDialog
            mode="edit"
            lesson={lesson}
            groups={groups}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Удалить занятие?"
            description={`Занятие «${lesson.title}» будет удалено вместе с привязанными заданиями.`}
            confirmLabel="Удалить"
            variant="destructive"
            successMessage="Занятие удалено"
            action={deleteLessonAction.bind(null, lesson.id)}
          />
          <AttendanceDialog
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            open={attendanceOpen}
            onOpenChange={setAttendanceOpen}
          />
        </>
      ) : null}
    </div>
  );
}
