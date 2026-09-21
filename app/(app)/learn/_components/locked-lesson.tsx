import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shown when a student opens a lesson their group doesn't have access to yet:
 * a blurred placeholder with a lock message and a way back.
 */
export function LockedLesson({ backHref }: { backHref: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border">
      {/* Blurred faux content behind the notice. */}
      <div aria-hidden className="space-y-4 p-6 blur-sm select-none pointer-events-none">
        <div className="h-6 w-1/2 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-40 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 p-6">
        <div className="max-w-sm space-y-3 rounded-lg border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold">Урок пока недоступен</h2>
          <p className="text-sm text-muted-foreground">
            Доступ к этому уроку ещё не открыт. Он появится, когда преподаватель откроет его или выполнятся условия доступа.
          </p>
          <Button asChild variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Вернуться назад
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
