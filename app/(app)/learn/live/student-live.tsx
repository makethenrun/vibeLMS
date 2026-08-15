"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { ItemRow, ItemSubmissionRow } from "@/types";
import type { SessionState } from "@/services/materials/live-session.service";
import { pollStudentSessionAction } from "@/app/(app)/live/actions";
import { StudentItem } from "../_components/student-item";

export function StudentLive({
  sessionId,
  items,
  initialState,
  initialSubmission,
}: {
  sessionId: string;
  items: ItemRow[];
  initialState: SessionState;
  initialSubmission: ItemSubmissionRow | null;
}) {
  const byId = useRef(new Map(items.map((i) => [i.id, i])));
  const [state, setState] = useState<SessionState>(initialState);
  const [submission, setSubmission] = useState<ItemSubmissionRow | null>(initialSubmission);
  const polling = useRef(false);
  const activeIdRef = useRef(initialState.activeItemId);

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const res = await pollStudentSessionAction(sessionId);
      if (res.success) {
        setState(res.data.state);
        // Only replace the submission when it belongs to the current item, so a
        // student's own just-submitted answer isn't clobbered by a stale null.
        if (res.data.state.activeItemId !== activeIdRef.current) {
          activeIdRef.current = res.data.state.activeItemId;
          setSubmission(res.data.submission);
        } else if (res.data.submission) {
          setSubmission(res.data.submission);
        }
      }
    } finally {
      polling.current = false;
    }
  }, [sessionId]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [poll]);

  if (state.endedAt) {
    return (
      <div className="space-y-4">
        <PageHeader title="Занятие завершено" description="Преподаватель завершил занятие." />
        <Button asChild variant="outline">
          <Link href="/learn">К материалам</Link>
        </Button>
      </div>
    );
  }

  const activeItem = state.activeItemId ? byId.current.get(state.activeItemId) : undefined;

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        <Radio className="h-5 w-5 animate-pulse text-red-500" />
        Идёт занятие
      </h1>

      {activeItem ? (
        <div className="relative">
          <StudentItem key={activeItem.id} item={activeItem} submission={submission ?? undefined} drawingOverride={null} />
          {state.drawing ? (
            // Live tutor drawing overlay (read-only), stretched over the block.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.drawing} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Ожидаем преподавателя — упражнение появится, когда он его выберет.
        </p>
      )}
    </div>
  );
}
