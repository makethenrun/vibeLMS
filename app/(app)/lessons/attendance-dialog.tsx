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
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import type { AttendanceRosterItem } from "@/types";
import { loadAttendanceAction, saveAttendanceAction } from "./actions";

interface AttendanceDialogProps {
  lessonId: string;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({
  lessonId,
  lessonTitle,
  open,
  onOpenChange,
}: AttendanceDialogProps) {
  const router = useRouter();
  const [roster, setRoster] = useState<AttendanceRosterItem[] | null>(null);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setRoster(null);
    loadAttendanceAction(lessonId).then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.success) {
        setRoster(result.data);
        setPresent(new Set(result.data.filter((item) => item.present).map((item) => item.studentId)));
      } else {
        toast.error(result.error);
        onOpenChange(false);
      }
    });
    return () => {
      active = false;
    };
  }, [open, lessonId, onOpenChange]);

  function toggle(studentId: string, checked: boolean) {
    setPresent((previous) => {
      const next = new Set(previous);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const result = await saveAttendanceAction(lessonId, [...present]);
    setSaving(false);
    if (result.success) {
      toast.success("Присутствие сохранено");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Присутствующие</DialogTitle>
          <DialogDescription>{lessonTitle}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-4 text-sm text-muted-foreground">Загрузка…</p>
        ) : !roster || roster.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">В группе нет учеников.</p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {roster.map((item) => (
              <label
                key={item.studentId}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-primary"
                  checked={present.has(item.studentId)}
                  onChange={(event) => toggle(item.studentId, event.target.checked)}
                />
                <span>{item.fullName}</span>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <LoadingButton loading={saving} disabled={loading} onClick={save}>
            Сохранить
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
