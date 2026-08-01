"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import {
  importItemsAction,
  pickerLessonsAction,
  pickerMaterialsAction,
  pickerModulesAction,
  type PickerLessonGroup,
  type PickerOption,
} from "../actions";

interface ImportDialogProps {
  itemIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function ImportDialog({ itemIds, open, onOpenChange, onDone }: ImportDialogProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<PickerOption[]>([]);
  const [lessonGroups, setLessonGroups] = useState<PickerLessonGroup[]>([]);
  const [modules, setModules] = useState<PickerOption[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMaterialId("");
    setLessonId("");
    setModuleId("");
    setLessonGroups([]);
    setModules([]);
    void pickerMaterialsAction().then(setMaterials);
  }, [open]);

  useEffect(() => {
    setLessonId("");
    setModuleId("");
    setModules([]);
    if (!materialId) {
      setLessonGroups([]);
      return;
    }
    void pickerLessonsAction(materialId).then(setLessonGroups);
  }, [materialId]);

  useEffect(() => {
    setModuleId("");
    if (!lessonId) {
      setModules([]);
      return;
    }
    void pickerModulesAction(lessonId).then(setModules);
  }, [lessonId]);

  async function handleImport() {
    if (!moduleId) {
      toast.error("Выберите модуль назначения");
      return;
    }
    setSaving(true);
    try {
      const result = await importItemsAction(itemIds, moduleId);
      if (result.success) {
        toast.success(`Импортировано упражнений: ${itemIds.length}`);
        onOpenChange(false);
        onDone();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Импорт упражнений</DialogTitle>
          <DialogDescription>
            Копировать выбранные упражнения ({itemIds.length}) в другой модуль.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Материал</label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите материал" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Урок</label>
            <Select value={lessonId} onValueChange={setLessonId} disabled={!materialId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите урок" />
              </SelectTrigger>
              <SelectContent>
                {lessonGroups.flatMap((g) =>
                  g.lessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{g.sectionTitle} · {l.title}</SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Модуль</label>
            <Select value={moduleId} onValueChange={setModuleId} disabled={!lessonId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите модуль" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <LoadingButton loading={saving} onClick={handleImport}>Импортировать</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
