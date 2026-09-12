"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBreadcrumbOverride, type MaterialNav } from "./breadcrumb-context";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Дашборд",
  learn: "Обучение",
  students: "Ученики",
  groups: "Группы",
  lessons: "Занятия",
  materials: "Материалы",
  homework: "Доп задания",
  payments: "Оплаты",
  statistics: "Статистика",
  settings: "Настройки",
  new: "Создание",
};

const UUID_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

/** Down-arrow after the material crumb → quick jump to any section's lesson. */
function MaterialNavDropdown({ nav }: { nav: MaterialNav }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent hover:text-foreground"
        aria-label="Навигация по материалу"
        aria-expanded={open}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute left-0 top-7 z-50 max-h-[70vh] w-72 overflow-y-auto rounded-lg border bg-popover p-1 text-sm shadow-md">
          {nav.sections.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Нет разделов.</p>
          ) : (
            nav.sections.map((section, i) => {
              const isOpen = expanded[i] ?? false;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => ({ ...p, [i]: !isOpen }))}
                    className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left font-medium hover:bg-accent"
                  >
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{section.title}</span>
                  </button>
                  {isOpen ? (
                    <ul className="pb-1 pl-6">
                      {section.lessons.length === 0 ? (
                        <li className="px-2 py-1 text-xs text-muted-foreground">Нет уроков</li>
                      ) : (
                        section.lessons.map((lesson) => (
                          <li key={lesson.href}>
                            <Link
                              href={lesson.href}
                              onClick={() => setOpen(false)}
                              className="block truncate rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              {lesson.title}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { crumbs: override, nav } = useBreadcrumbOverride();

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

  // Attach the material-nav dropdown to the first crumb matching the anchor.
  let navAttached = false;

  return (
    <nav className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)} aria-label="Хлебные крошки">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const showNav = Boolean(nav) && !navAttached && item.href === nav!.anchorHref;
        if (showNav) navAttached = true;
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
            {showNav ? <MaterialNavDropdown nav={nav!} /> : null}
          </Fragment>
        );
      })}
    </nav>
  );
}
