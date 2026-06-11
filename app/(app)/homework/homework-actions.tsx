"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteHomeworkAction } from "./actions";
import { DuplicateHomeworkDialog } from "./duplicate-dialog";

interface LessonOption {
  id: string;
  label: string;
}

export function HomeworkActions({
  id,
  title,
  lessons,
}: {
  id: string;
  title: string;
  lessons: LessonOption[];
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Действия</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/homework/${id}`}>
              <ExternalLink className="h-4 w-4" />
              Открыть
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDuplicateOpen(true)}>
            <Copy className="h-4 w-4" />
            Дублировать
          </DropdownMenuItem>
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить задание?"
        description={`«${title}» и все ответы учеников будут удалены.`}
        confirmLabel="Удалить"
        variant="destructive"
        successMessage="Задание удалено"
        action={deleteHomeworkAction.bind(null, id)}
      />
      <DuplicateHomeworkDialog
        homeworkId={id}
        lessons={lessons}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />
    </>
  );
}
