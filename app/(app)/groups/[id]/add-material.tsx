"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { cn } from "@/lib/utils";
import { addMaterialToGroupAction } from "../actions";

interface MaterialOption { id: string; title: string }

export function AddMaterialToGroup({ groupId, materials }: { groupId: string; materials: MaterialOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [materialId, setMaterialId] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => m.title.toLowerCase().includes(q));
  }, [materials, query]);

  async function submit() {
    if (!materialId) return toast.error("Выберите материал");
    setSaving(true);
    const result = await addMaterialToGroupAction(groupId, materialId);
    setSaving(false);
    if (result.success) {
      toast.success("Материал добавлен");
      setOpen(false);
      setMaterialId("");
      setQuery("");
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
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск материала…"
                className="pl-8"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-muted-foreground">Ничего не найдено.</p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaterialId(m.id)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                      materialId === m.id && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <LoadingButton loading={saving} disabled={!materialId} onClick={submit}>Добавить</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
