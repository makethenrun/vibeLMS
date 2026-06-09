"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Дашборд",
  students: "Ученики",
  groups: "Группы",
  lessons: "Занятия",
  materials: "Материалы",
  homework: "Домашние задания",
  payments: "Оплаты",
  statistics: "Статистика",
  settings: "Настройки",
  new: "Создание",
};

const UUID_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}
      aria-label="Хлебные крошки"
    >
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = UUID_PREFIX.test(segment)
          ? "Детали"
          : (SEGMENT_LABELS[segment] ?? decodeURIComponent(segment));

        return (
          <Fragment key={href}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {isLast ? (
              <span className="truncate font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="truncate transition-colors hover:text-foreground">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
