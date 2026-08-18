"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  initialItemIds,
  initialSubmissions,
}: {
  sessionId: string;
  items: ItemRow[];
  initialState: SessionState;
  initialItemIds: string[];
  initialSubmissions: Record<string, ItemSubmissionRow>;
}) {
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const [state, setState] = useState<SessionState>(initialState);
  const [itemIds, setItemIds] = useState<string[]>(initialItemIds);
  const [submissions, setSubmissions] = useState<Record<string, ItemSubmissionRow>>(initialSubmissions);
  const polling = useRef(false);

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const res = await pollStudentSessionAction(sessionId);
      if (res.success) {
        setState(res.data.state);
        setItemIds(res.data.itemIds);
        setSubmissions(res.data.submissions);
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

  const singleItem = state.kind === "item" && itemIds.length === 1;
  const activeItems = itemIds.map((id) => itemById.get(id)).filter((i): i is ItemRow => Boolean(i));

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        <Radio className="h-5 w-5 animate-pulse text-red-500" />
        Идёт занятие
      </h1>

      {activeItems.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Ожидаем преподавателя — задание появится, когда он его выберет.
        </p>
      ) : singleItem ? (
        <div className="relative">
          <StudentItem key={activeItems[0].id} item={activeItems[0]} submission={submissions[activeItems[0].id]} drawingOverride={null} />
          {state.drawing ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.drawing} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {activeItems.map((item) => (
            <StudentItem key={item.id} item={item} submission={submissions[item.id]} drawingOverride={null} />
          ))}
        </div>
      )}
    </div>
  );
}
