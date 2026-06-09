import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

/** Tailwind-aware className combiner used by every shadcn/ui component. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return parseISO(value);
}

export function formatDate(value: string | number | Date): string {
  return format(toDate(value), "d MMMM yyyy", { locale: ru });
}

export function formatDateTime(value: string | number | Date): string {
  return format(toDate(value), "d MMM yyyy, HH:mm", { locale: ru });
}

export function formatTime(value: string | number | Date): string {
  return format(toDate(value), "HH:mm", { locale: ru });
}

export function formatWeekday(value: string | number | Date): string {
  return format(toDate(value), "EEEE", { locale: ru });
}

export function formatShortDate(value: string | number | Date): string {
  return format(toDate(value), "d MMM", { locale: ru });
}

export function formatRelative(value: string | number | Date): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true, locale: ru });
}

export function formatCurrency(amount: number, currency = "RUB"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Two-letter initials for avatars. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("");
  return initials || "?";
}

/** Convert a value to an `<input type="datetime-local">` string in local time. */
export function toDateTimeLocalValue(value: string | number | Date): string {
  const date = toDate(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
