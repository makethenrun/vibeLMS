"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBreadcrumbOverride } from "./breadcrumb-context";

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
  const { crumbs: override } = useBreadcrumbOverride();

  // A page may supply its own crumbs (e.g. material sub-pages that have no
  // index route for intermediate segments).
  const items = override
    ? override.map((c) => ({ label: c.label, href: c.href }))
    : pathname
        .split("/")
        .filter(Boolean)
        .map((segment, index, arr) => ({
          label: UUID_PREFIX.test(segment) ? "Детали" : SEGMENT_LABELS[segment] ?? decodeURIComponent(segment),
          href: `/${arr.slice(0, index + 1).join("/")}`,
        }));

  if (items.length === 0) return null;

  return (
    <nav className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)} aria-label="Хлебные крошки">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${item.href}-${index}`}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {isLast ? (
              <span className="truncate font-medium text-foreground">{item.label}</span>
            ) : (
              <Link href={item.href} className="truncate transition-colors hover:text-foreground">
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
