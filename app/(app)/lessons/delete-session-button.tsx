"use client";

import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteSessionAction } from "@/app/(app)/live/actions";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Удалить занятие">
          <Trash2 className="h-4 w-4" />
        </Button>
      }
      title="Удалить занятие из истории?"
      description="Запись занятия и посещаемость будут удалены без возможности восстановления."
      confirmLabel="Удалить"
      variant="destructive"
      successMessage="Удалено"
      action={() => deleteSessionAction(sessionId)}
    />
  );
}
