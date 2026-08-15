"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingButton } from "@/components/shared/loading-button";
import { startSessionAction } from "@/app/(app)/live/actions";

export function StartSessionScreen({
  materialId,
  groupId,
  materialTitle,
  groupName,
  conflict,
}: {
  materialId: string;
  groupId: string;
  materialTitle: string;
  groupName: string;
  conflict: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const result = await startSessionAction(materialId, groupId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Живое занятие" description={`${groupName} · ${materialTitle}`} />
      <div className="rounded-lg border bg-card p-6">
        {conflict ? (
          <p className="mb-4 text-sm text-amber-700">
            У группы уже идёт занятие по другому материалу. Начав новое, вы завершите предыдущее.
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            Начните занятие, чтобы переключать учеников по упражнениям, рисовать поверх задания и видеть их результаты в реальном времени.
          </p>
        )}
        <LoadingButton loading={loading} onClick={start}>
          <Radio className="h-4 w-4" />
          Начать занятие
        </LoadingButton>
      </div>
    </div>
  );
}
