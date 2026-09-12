"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentWithStudent } from "@/types";
import { setPaymentStatusAction } from "./actions";

export function PendingPayments({ pending }: { pending: PaymentWithStudent[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(id: string, status: "CONFIRMED" | "REJECTED") {
    startTransition(async () => {
      const result = await setPaymentStatusAction(id, status);
      if (result.success) {
        toast.success(status === "CONFIRMED" ? "Оплата подтверждена" : "Оплата отклонена");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (pending.length === 0) return null;

  return (
    <Card className="border-amber-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">На подтверждении ({pending.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {pending.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <span className="font-medium">{p.studentName}</span>
                <span className="ml-2 text-muted-foreground">
                  {formatCurrency(Number(p.amount))} · {p.lessons ?? "—"} зан. · {formatDate(p.payment_date)}
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" className="text-green-700" disabled={isPending} onClick={() => decide(p.id, "CONFIRMED")}>
                  <Check className="h-4 w-4" />
                  Подтвердить
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" disabled={isPending} onClick={() => decide(p.id, "REJECTED")}>
                  <X className="h-4 w-4" />
                  Отклонить
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
