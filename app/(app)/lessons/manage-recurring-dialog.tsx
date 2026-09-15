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
import { cn } from "@/lib/utils";
import { WEEKDAYS, buildRecurringRows, validateDayTimes, type DayTime } from "@/lib/lessons/recurring";
import type { LessonSeriesSummary } from "@/services/lessons/lessons.service";
import {
  deleteLessonSeriesByIdAction,
  getSeriesEditDataAction,
  listLessonSeriesAction,
  regenerateLessonSeriesAction,
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
  const [count, setCount] = useState(0);
  const [title, setTitle] = useState("");
  const [numbered, setNumbered] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dayTimes, setDayTimes] = useState<Map<number, DayTime>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onOpen(next: boolean) {
    setOpen(next);
    if (next) {
      setSeriesId("");
      setDayTimes(new Map());
      const r = await listLessonSeriesAction();
      if (r.success) setSeries(r.data.series);
      else toast.error(r.error);
    }
  }

  function toggleDay(day: number) {
    setDayTimes((prev) => {
      const next = new Map(prev);
      if (next.has(day)) next.delete(day);
      else next.set(day, { start: "10:00", end: "11:00" });
      return next;
    });
  }
  function setDayTime(day: number, field: "start" | "end", value: string) {
    setDayTimes((prev) => {
      const next = new Map(prev);
      const cur = next.get(day);
      if (cur) next.set(day, { ...cur, [field]: value });
      return next;
    });
  }

  async function pickSeries(id: string) {
    setSeriesId(id);
    setDayTimes(new Map());
    if (!id) return;
    setLoading(true);
    const r = await getSeriesEditDataAction(id);
    setLoading(false);
    if (!r.success) return toast.error(r.error);
    setTitle(r.data.title);
    setMeetingUrl(r.data.meetingUrl ?? "");
    setCount(r.data.lessons.length);
    // Derive current days, per-day time, and date range from the lessons.
    const dts = new Map<number, DayTime>();
    let minD = "";
    let maxD = "";
    for (const l of r.data.lessons) {
      const day = new Date(l.start_time).getDay();
      if (!dts.has(day)) dts.set(day, { start: hhmm(l.start_time), end: hhmm(l.end_time) });
      const d = ymd(l.start_time);
      if (!minD || d < minD) minD = d;
      if (!maxD || d > maxD) maxD = d;
    }
    setDayTimes(dts);
    setFromDate(minD);
    setToDate(maxD);
    setNumbered(false);
  }

  async function save() {
    if (title.trim().length < 2) return toast.error("Название: минимум 2 символа");
    if (!fromDate || !toDate) return toast.error("Укажите период");
    const err = validateDayTimes(dayTimes);
    if (err) return toast.error(err);
    const rows = buildRecurringRows({ fromDate, toDate, dayTimes, title, numbered });
    if (rows.length === 0) return toast.error("В выбранном периоде нет таких дней");

    setSaving(true);
    const r = await regenerateLessonSeriesAction(seriesId, title.trim(), meetingUrl.trim() || undefined, rows);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Регулярные занятия</DialogTitle>
          <DialogDescription>Выберите серию, чтобы изменить дни, время и период или удалить предстоящие занятия.</DialogDescription>
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
                <div className="flex items-center gap-2">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название занятия" />
                  <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-muted-foreground" title="Добавлять номер занятия к названию (№1, №2, …)">
                    <input type="checkbox" checked={numbered} onChange={(e) => setNumbered(e.target.checked)} />
                    № занятия
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">С даты</label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">По дату</label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Дни недели и время</label>
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map((w) => (
                    <button
                      key={w.day}
                      type="button"
                      onClick={() => toggleDay(w.day)}
                      className={cn(
                        "h-9 w-10 rounded-md border text-sm",
                        dayTimes.has(w.day) ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
                      )}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
                {WEEKDAYS.filter((w) => dayTimes.has(w.day)).map((w) => {
                  const dt = dayTimes.get(w.day)!;
                  return (
                    <div key={w.day} className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-sm text-muted-foreground">{w.label}</span>
                      <Input type="time" value={dt.start} onChange={(e) => setDayTime(w.day, "start", e.target.value)} className="h-8" />
                      <span className="text-muted-foreground">—</span>
                      <Input type="time" value={dt.end} onChange={(e) => setDayTime(w.day, "end", e.target.value)} className="h-8" />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Ссылка (необязательно)</label>
                <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://…" />
              </div>
              <p className="text-xs text-muted-foreground">
                Предстоящие занятия серии ({count}) будут пересозданы по выбранным дням, времени и периоду. Прошедшие занятия не затрагиваются.
              </p>
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
