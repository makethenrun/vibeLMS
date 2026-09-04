import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ModuleWithItems } from "@/types";

/** Prev/next module links within a lesson (shown above and below the module). */
export function ModuleNav({
  lessonId,
  modules,
  activeId,
  basePath = "/materials/lessons",
}: {
  lessonId: string;
  modules: ModuleWithItems[];
  activeId?: string;
  basePath?: string;
}) {
  if (modules.length <= 1) return null;
  const idx = modules.findIndex((m) => m.id === activeId);
  const prev = idx > 0 ? modules[idx - 1] : null;
  const next = idx >= 0 && idx < modules.length - 1 ? modules[idx + 1] : null;
  const prevNumber = idx; // 1-based number of the previous module
  const nextNumber = idx + 2;

  return (
    <div className="flex items-center justify-between gap-2">
      {prev ? (
        <Button asChild variant="outline" size="sm" className="max-w-[45%]">
          <Link href={`${basePath}/${lessonId}?m=${prev.id}`}>
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{prevNumber}. {prev.title}</span>
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button asChild variant="outline" size="sm" className="max-w-[45%]">
          <Link href={`${basePath}/${lessonId}?m=${next.id}`}>
            <span className="truncate">{nextNumber}. {next.title}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}
