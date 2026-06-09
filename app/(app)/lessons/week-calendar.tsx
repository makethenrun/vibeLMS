"use client";

import { addDays, format, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { LessonWithGroup } from "@/types";
import { LessonCard } from "./lesson-card";

interface GroupOption {
  id: string;
  name: string;
}

interface WeekCalendarProps {
  weekStartISO: string;
  lessons: LessonWithGroup[];
  isTutor: boolean;
  groups: GroupOption[];
}

export function WeekCalendar({ weekStartISO, lessons, isTutor, groups }: WeekCalendarProps) {
  const weekStart = parseISO(weekStartISO);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = new Date();

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const dayLessons = lessons
          .filter((lesson) => isSameDay(parseISO(lesson.start_time), day))
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        const isToday = isSameDay(day, today);

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex flex-col rounded-lg border bg-card p-2",
              isToday && "border-primary ring-1 ring-primary/30",
            )}
          >
            <div className="mb-2 px-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {format(day, "EEEEEE", { locale: ru })}
              </p>
              <p className={cn("text-sm font-semibold", isToday && "text-primary")}>
                {format(day, "d MMM", { locale: ru })}
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {dayLessons.length === 0 ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">Нет занятий</p>
              ) : (
                dayLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    isTutor={isTutor}
                    groups={groups}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
