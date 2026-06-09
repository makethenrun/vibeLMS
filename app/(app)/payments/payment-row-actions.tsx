"use client";

import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deletePaymentAction } from "./actions";

export function PaymentRowActions({ id }: { id: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon" className="text-destructive" aria-label="Удалить">
          <Trash2 className="h-4 w-4" />
        </Button>
      }
      title="Удалить оплату?"
      description="Запись об оплате будет удалена без возможности восстановления."
      confirmLabel="Удалить"
      variant="destructive"
      successMessage="Оплата удалена"
      action={deletePaymentAction.bind(null, id)}
    />
  );
}
