import { addDays, addWeeks, endOfWeek, format, startOfWeek } from "date-fns";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const; // Monday

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, WEEK_OPTIONS);
}

export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, WEEK_OPTIONS);
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function shiftWeek(date: Date, amount: number): Date {
  return addWeeks(date, amount);
}

/** yyyy-MM-dd for use in query strings. */
export function toDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateParam(value: string | undefined): Date {
  if (value && !Number.isNaN(Date.parse(value))) return new Date(value);
  return new Date();
}
