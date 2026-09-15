"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { createRecurringLessonsAction } from "./actions";

interface GroupOption { id: string; name: string }

export function RecurringLessonDialog({ groups, trigger }: { groups: GroupOption[]; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [numbered, setNumbered] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // Each selected weekday has its own start/end time.
  const [dayTimes, setDayTimes] = useState<Map<number, DayTime>>(new Map());
  const [meetingUrl, setMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function submit() {
    if (!groupId) return toast.error("Выберите группу");
    if (title.trim().length < 2) return toast.error("Название: минимум 2 символа");
    if (!fromDate || !toDate) return toast.error("Укажите период");
    const err = validateDayTimes(dayTimes);
    if (err) return toast.error(err);

    const rows = buildRecurringRows({ fromDate, toDate, dayTimes, title, numbered });
    if (rows.length === 0) return toast.error("В выбранном периоде нет таких дней");

    setSaving(true);
    const result = await createRecurringLessonsAction(groupId, meetingUrl.trim() || undefined, rows);
    setSaving(false);
    if (result.success) {
      toast.success(`Создано занятий: ${result.data.count}`);
      setOpen(false);
      setTitle("");
      setDayTimes(new Map());
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Регулярные занятия</DialogTitle>
          <DialogDescription>Создайте серию занятий по дням недели за период. У каждого дня своё время.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Группа</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
              <option value="">Выберите группу</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <LoadingButton loading={saving} onClick={submit}>Создать серию</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
