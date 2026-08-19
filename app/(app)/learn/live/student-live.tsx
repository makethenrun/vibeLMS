"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { ItemRow, ItemSubmissionRow } from "@/types";
import type { SessionState } from "@/services/materials/live-session.service";
import { pollStudentSessionAction, saveStudentDrawingAction } from "@/app/(app)/live/actions";
import { StudentItem } from "../_components/student-item";

export function StudentLive({
  sessionId,
  items,
  initialState,
  initialItemIds,
  initialSubmissions,
  initialTutorDrawings,
  initialMyDrawings,
}: {
  sessionId: string;
  items: ItemRow[];
  initialState: SessionState;
  initialItemIds: string[];
  initialSubmissions: Record<string, ItemSubmissionRow>;
  initialTutorDrawings: Record<string, string>;
  initialMyDrawings: Record<string, string>;
}) {
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const [state, setState] = useState<SessionState>(initialState);
  const [itemIds, setItemIds] = useState<string[]>(initialItemIds);
  const [submissions, setSubmissions] = useState<Record<string, ItemSubmissionRow>>(initialSubmissions);
  const [tutorDrawings, setTutorDrawings] = useState<Record<string, string>>(initialTutorDrawings);
  const myDrawingsRef = useRef<Record<string, string>>(initialMyDrawings);
  const polling = useRef(false);
  const lastFocus = useRef<string | null>(null);

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const res = await pollStudentSessionAction(sessionId);
      if (res.success) {
        setState(res.data.state);
        setItemIds(res.data.itemIds);
        setSubmissions(res.data.submissions);
        setTutorDrawings(res.data.tutorDrawings);
        myDrawingsRef.current = res.data.myDrawings;
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

  // Scroll to the exercise the tutor pinned.
  useEffect(() => {
    const focus = state.focusedItemId;
    if (focus && focus !== lastFocus.current) {
      lastFocus.current = focus;
      document.getElementById(`item-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (!focus) lastFocus.current = null;
  }, [state.focusedItemId]);

  async function saveDrawing(itemId: string, dataUrl: string | null) {
    await saveStudentDrawingAction(sessionId, itemId, dataUrl);
  }

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
      ) : (
        <div className="space-y-4">
          {activeItems.map((item) => (
            <div key={item.id} className="relative">
              <StudentItem
                item={item}
                submission={submissions[item.id]}
                drawingOverride={myDrawingsRef.current[item.id] ?? null}
                saveDrawing={(d) => saveDrawing(item.id, d)}
                liveDraw
                drawStartActive={false}
              />
              {tutorDrawings[item.id] ? (
                // Live tutor drawing overlay (read-only).
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tutorDrawings[item.id]} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
