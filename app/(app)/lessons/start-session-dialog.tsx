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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger><SelectValue placeholder="Выберите группу" /></SelectTrigger>
              <SelectContent>
                {groups.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Нет доступных групп</div>
                ) : (
                  groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Материал</label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger><SelectValue placeholder="Выберите материал" /></SelectTrigger>
              <SelectContent>
                {materials.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Нет доступных материалов</div>
                ) : (
                  materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)
                )}
              </SelectContent>
            </Select>
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
