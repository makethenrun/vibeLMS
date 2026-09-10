"use client";

import { useEffect, useState } from "react";
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
import type { AttendanceRosterItem } from "@/types";
import { loadAttendanceAction } from "./actions";

interface AttendanceDialogProps {
  lessonId: string;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({ lessonId, lessonTitle, open, onOpenChange }: AttendanceDialogProps) {
  const [roster, setRoster] = useState<AttendanceRosterItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setRoster(null);
    loadAttendanceAction(lessonId).then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.success) setRoster(result.data);
      else { toast.error(result.error); onOpenChange(false); }
    });
    return () => { active = false; };
  }, [open, lessonId, onOpenChange]);

  const presentCount = roster?.filter((r) => r.present).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Кто был на занятии</DialogTitle>
          <DialogDescription>
            {lessonTitle}
            {roster && roster.length > 0 ? ` · ${presentCount} из ${roster.length}` : null}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-4 text-sm text-muted-foreground">Загрузка…</p>
        ) : !roster || roster.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">В группе нет учеников.</p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {roster.map((item) => (
              <li key={item.studentId} className="flex items-center justify-between gap-2 rounded px-1 py-1.5 text-sm">
                <span>{item.fullName}</span>
                {item.present ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Заходил</span>
                ) : (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Не заходил</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
