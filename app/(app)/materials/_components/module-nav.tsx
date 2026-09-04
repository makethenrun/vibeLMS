import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FlatModule } from "@/services/materials/module-order.service";

/**
 * Prev/next module links across the whole material (shown above and below the
 * module). When the current module is the first in its lesson, "back" points to
 * the last module of the previous lesson; likewise "forward" past the last.
 */
export function ModuleNav({
  modules,
  activeModuleId,
  hrefFor,
}: {
  modules: FlatModule[];
  activeModuleId?: string;
  hrefFor: (lessonId: string, moduleId: string) => string;
}) {
  if (modules.length <= 1) return null;
  const idx = modules.findIndex((m) => m.moduleId === activeModuleId);
  if (idx === -1) return null;
  const prev = idx > 0 ? modules[idx - 1] : null;
  const next = idx < modules.length - 1 ? modules[idx + 1] : null;

  return (
    <div className="flex items-center justify-between gap-2">
      {prev ? (
        <Button asChild variant="outline" size="sm" className="max-w-[45%]">
          <Link href={hrefFor(prev.lessonId, prev.moduleId)}>
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{prev.title}</span>
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button asChild variant="outline" size="sm" className="max-w-[45%]">
          <Link href={hrefFor(next.lessonId, next.moduleId)}>
            <span className="truncate">{next.title}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}
