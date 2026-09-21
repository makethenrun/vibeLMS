"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { startSessionAction } from "@/app/(app)/live/actions";

export function StartSessionDialog({
  groups,
  materials,
}: {
  groups: { id: string; name: string }[];
  materials: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [loading, setLoading] = useState(false);

  async function start() {
    if (!groupId || !materialId) return;
    setLoading(true);
    const result = await startSessionAction(materialId, groupId);
    setLoading(false);
    if (result.success) {
      router.push(`/materials/${materialId}/session/${groupId}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Radio className="h-4 w-4" />
          Провести занятие
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Живое занятие</DialogTitle>
          <DialogDescription>Выберите группу и материал — ученики группы подключатся к занятию.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Группа</label>
            <SearchableSelect
              value={groupId}
              onValueChange={setGroupId}
              items={groups.map((g) => ({ value: g.id, label: g.name }))}
              placeholder="Выберите группу"
              searchPlaceholder="Поиск группы…"
              emptyText="Нет доступных групп"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Материал</label>
            <SearchableSelect
              value={materialId}
              onValueChange={setMaterialId}
              items={materials.map((m) => ({ value: m.id, label: m.title }))}
              placeholder="Выберите материал"
              searchPlaceholder="Поиск материала…"
              emptyText="Нет доступных материалов"
            />
          </div>

          <LoadingButton loading={loading} onClick={start} disabled={!groupId || !materialId} className="w-full">
            <Radio className="h-4 w-4" />
            Начать занятие
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
