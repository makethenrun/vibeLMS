"use client";

import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteLessonAction } from "./actions";

export function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Удалить занятие">
          <Trash2 className="h-4 w-4" />
        </Button>
      }
      title="Удалить занятие из истории?"
      description="Занятие будет удалено из расписания и истории без возможности восстановления."
      confirmLabel="Удалить"
      variant="destructive"
      successMessage="Удалено"
      action={() => deleteLessonAction(lessonId)}
    />
  );
}
