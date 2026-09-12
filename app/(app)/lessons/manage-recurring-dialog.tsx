"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
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
import type { LessonSeriesSummary } from "@/services/lessons/lessons.service";
import {
  deleteLessonSeriesByIdAction,
  getSeriesEditDataAction,
  listLessonSeriesAction,
  updateLessonSeriesAction,
} from "./actions";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function ymd(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ManageRecurringDialog({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [series, setSeries] = useState<LessonSeriesSummary[]>([]);
  const [seriesId, setSeriesId] = useState("");
  const [lessons, setLessons] = useState<{ id: string; start_time: string; end_time: string }[]>([]);
  const [title, setTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onOpen(next: boolean) {
    setOpen(next);
    if (next) {
      setSeriesId("");
      setLessons([]);
      const r = await listLessonSeriesAction();
      if (r.success) setSeries(r.data.series);
      else toast.error(r.error);
    }
  }

  async function pickSeries(id: string) {
    setSeriesId(id);
    setLessons([]);
    if (!id) return;
    setLoading(true);
    const r = await getSeriesEditDataAction(id);
    setLoading(false);
    if (!r.success) return toast.error(r.error);
    setLessons(r.data.lessons);
    setTitle(r.data.title);
    setMeetingUrl(r.data.meetingUrl ?? "");
    if (r.data.lessons[0]) {
      setStartTime(hhmm(r.data.lessons[0].start_time));
      setEndTime(hhmm(r.data.lessons[0].end_time));
    }
  }

  async function save() {
    if (title.trim().length < 2) return toast.error("Название: минимум 2 символа");
    if (endTime <= startTime) return toast.error("Окончание должно быть позже начала");
    const rows = lessons.map((l) => ({
      id: l.id,
      startTime: new Date(`${ymd(l.start_time)}T${startTime}`).toISOString(),
      endTime: new Date(`${ymd(l.start_time)}T${endTime}`).toISOString(),
    }));
    setSaving(true);
    const r = await updateLessonSeriesAction(title.trim(), meetingUrl.trim() || undefined, rows);
    setSaving(false);
    if (r.success) {
      toast.success(`Обновлено занятий: ${r.data.count}`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  async function removeSeries() {
    if (!window.confirm("Удалить всю серию (предстоящие занятия)?")) return;
    setDeleting(true);
    const r = await deleteLessonSeriesByIdAction(seriesId);
    setDeleting(false);
    if (r.success) {
      toast.success(`Удалено занятий: ${r.data.count}`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Регулярные занятия</DialogTitle>
          <DialogDescription>Выберите серию, чтобы отредактировать или удалить предстоящие занятия.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Серия</label>
            <select value={seriesId} onChange={(e) => pickSeries(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
              <option value="">Выберите серию</option>
              {series.map((s) => (
                <option key={s.seriesId} value={s.seriesId}>
                  {s.title} · {s.groupName} · {s.count} зан. (с {format(new Date(s.firstStart), "d MMM", { locale: ru })})
                </option>
              ))}
            </select>
            {series.length === 0 ? <p className="text-xs text-muted-foreground">Нет серий с предстоящими занятиями.</p> : null}
          </div>

          {loading ? <p className="text-sm text-muted-foreground">Загрузка…</p> : null}

          {seriesId && !loading ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Название</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название занятия" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Начало</label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Окончание</label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Ссылка (необязательно)</label>
                <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://…" />
              </div>
              <p className="text-xs text-muted-foreground">Изменения применятся ко всем предстоящим занятиям серии ({lessons.length}). Дни занятий сохраняются, меняется только время.</p>
            </>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between">
          {seriesId ? (
            <LoadingButton variant="outline" className="text-destructive" loading={deleting} onClick={removeSeries}>
              Удалить серию
            </LoadingButton>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <LoadingButton loading={saving} disabled={!seriesId || loading} onClick={save}>Сохранить</LoadingButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
