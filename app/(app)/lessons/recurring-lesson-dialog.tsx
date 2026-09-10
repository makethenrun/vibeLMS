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
import { createRecurringLessonsAction } from "./actions";

interface GroupOption { id: string; name: string }

// Пн..Вс → JS getDay() values (Sun = 0).
const WEEKDAYS: { label: string; day: number }[] = [
  { label: "Пн", day: 1 },
  { label: "Вт", day: 2 },
  { label: "Ср", day: 3 },
  { label: "Чт", day: 4 },
  { label: "Пт", day: 5 },
  { label: "Сб", day: 6 },
  { label: "Вс", day: 0 },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function RecurringLessonDialog({ groups, trigger }: { groups: GroupOption[]; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [numbered, setNumbered] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [days, setDays] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function buildRows(): { title: string; startTime: string; endTime: string }[] {
    const [fy, fm, fd] = fromDate.split("-").map(Number);
    const [ty, tm, td] = toDate.split("-").map(Number);
    const cur = new Date(fy, fm - 1, fd);
    const end = new Date(ty, tm - 1, td);
    const rows: { title: string; startTime: string; endTime: string }[] = [];
    let n = 0;
    while (cur <= end && rows.length < 400) {
      if (days.has(cur.getDay())) {
        const ds = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
        n += 1;
        rows.push({
          title: numbered ? `${title.trim()} №${n}` : title.trim(),
          startTime: new Date(`${ds}T${startTime}`).toISOString(),
          endTime: new Date(`${ds}T${endTime}`).toISOString(),
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return rows;
  }

  async function submit() {
    if (!groupId) return toast.error("Выберите группу");
    if (title.trim().length < 2) return toast.error("Название: минимум 2 символа");
    if (!fromDate || !toDate) return toast.error("Укажите период");
    if (days.size === 0) return toast.error("Выберите хотя бы один день недели");
    if (endTime <= startTime) return toast.error("Окончание должно быть позже начала");

    const rows = buildRows();
    if (rows.length === 0) return toast.error("В выбранном периоде нет таких дней");

    setSaving(true);
    const result = await createRecurringLessonsAction(groupId, meetingUrl.trim() || undefined, rows);
    setSaving(false);
    if (result.success) {
      toast.success(`Создано занятий: ${result.data.count}`);
      setOpen(false);
      setTitle("");
      setDays(new Set());
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
          <DialogDescription>Создайте серию занятий по дням недели за период.</DialogDescription>
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

          <div className="space-y-1">
            <label className="text-sm font-medium">Дни недели</label>
            <div className="flex flex-wrap gap-1">
              {WEEKDAYS.map((w) => (
                <button
                  key={w.day}
                  type="button"
                  onClick={() => toggleDay(w.day)}
                  className={cn(
                    "h-9 w-10 rounded-md border text-sm",
                    days.has(w.day) ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <LoadingButton loading={saving} onClick={submit}>Создать серию</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
