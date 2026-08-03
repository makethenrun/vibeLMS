"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionWithLessons } from "@/types";

export function StudentSectionTree({
  sections,
  activeLessonId,
  base,
}: {
  sections: SectionWithLessons[];
  activeLessonId?: string;
  base: string;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (sections.length === 0) return <p className="text-sm text-muted-foreground">Пока нет разделов.</p>;

  return (
    <ul className="space-y-2 text-sm">
      {sections.map((section) => {
        const isCollapsed = collapsed[section.id] ?? false;
        return (
          <li key={section.id} className="space-y-1">
            <div className="flex items-center gap-1">
              <Button
                size="icon" variant="ghost" className="h-6 w-6 shrink-0"
                onClick={() => setCollapsed((p) => ({ ...p, [section.id]: !isCollapsed }))}
                aria-label={isCollapsed ? "Развернуть" : "Свернуть"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <span className="flex-1 truncate font-medium">{section.title}</span>
            </div>
            {isCollapsed ? null : (
              <ul className="space-y-0.5 pl-7">
                {section.lessons.length === 0 ? (
                  <li className="px-2 py-1 text-xs text-muted-foreground">Нет уроков</li>
                ) : (
                  section.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`${base}/lessons/${lesson.id}`}
                        className={cn(
                          "block truncate rounded px-2 py-1 hover:bg-accent",
                          lesson.id === activeLessonId && "bg-accent font-medium",
                        )}
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
