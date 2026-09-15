"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { addMaterialToGroupAction } from "../actions";

interface MaterialOption { id: string; title: string }

export function AddMaterialToGroup({ groupId, materials }: { groupId: string; materials: MaterialOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [materialId, setMaterialId] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!materialId) return toast.error("Выберите материал");
    setSaving(true);
    const result = await addMaterialToGroupAction(groupId, materialId);
    setSaving(false);
    if (result.success) {
      toast.success("Материал добавлен");
      setOpen(false);
      setMaterialId("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={materials.length === 0}>
          <Plus className="h-4 w-4" />
          Добавить материал
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить материал</DialogTitle>
          <DialogDescription>Откройте группе доступ к материалу.</DialogDescription>
        </DialogHeader>
        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">Все материалы уже доступны этой группе.</p>
        ) : (
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Выберите материал</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <LoadingButton loading={saving} disabled={!materialId} onClick={submit}>Добавить</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
