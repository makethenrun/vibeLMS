"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Radio, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { PreviewProvider } from "@/app/(app)/learn/_components/preview-provider";
import { StudentItem } from "@/app/(app)/learn/_components/student-item";
import { cn } from "@/lib/utils";
import type { ItemRow, ItemSubmissionRow } from "@/types";
import type { SessionResultRow, SessionState } from "@/services/materials/live-session.service";
import type { TreeSection } from "@/services/materials/material-tree.service";
import {
  endSessionAction,
  pollSessionResultsAction,
  setActiveItemAction,
  setSessionDrawingAction,
} from "@/app/(app)/live/actions";
import { ExerciseTree } from "./exercise-tree";

interface SessionItem {
  id: string;
  item: ItemRow;
}

export function SessionConsole({
  sessionId,
  materialTitle,
  groupName,
  groupId,
  items,
  tree,
  students,
  initialState,
}: {
  sessionId: string;
  materialTitle: string;
  groupName: string;
  groupId: string;
  items: SessionItem[];
  tree: TreeSection[];
  students: { id: string; fullName: string }[];
  initialState: SessionState;
}) {
  const router = useRouter();
  const [activeItemId, setActiveItemId] = useState<string | null>(initialState.activeItemId);
  const [centerDrawing, setCenterDrawing] = useState<string | null>(initialState.drawing);
  const [results, setResults] = useState<SessionResultRow[]>(
    students.map((s) => ({ studentId: s.id, fullName: s.fullName, submission: null })),
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const polling = useRef(false);

  const activeItem = items.find((i) => i.id === activeItemId) ?? null;

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const res = await pollSessionResultsAction(sessionId);
      if (res.success) {
        setResults(res.data.results);
        if (res.data.state.endedAt) router.push(`/groups/${groupId}`);
      }
    } finally {
      polling.current = false;
    }
  }, [sessionId, groupId, router]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [poll]);

  async function selectItem(itemId: string) {
    setActiveItemId(itemId);
    setCenterDrawing(null);
    const res = await setActiveItemAction(sessionId, itemId);
    if (!res.success) toast.error(res.error);
  }

  async function saveDrawing(dataUrl: string | null) {
    const res = await setSessionDrawingAction(sessionId, dataUrl);
    if (!res.success) toast.error(res.error);
  }

  async function end() {
    setEnding(true);
    const res = await endSessionAction(sessionId);
    setEnding(false);
    if (res.success) router.push(`/groups/${groupId}`);
    else toast.error(res.error);
  }

  function statusLabel(sub: ItemSubmissionRow | null): { text: string; cls: string } {
    if (!sub) return { text: "не начал", cls: "text-muted-foreground" };
    if (sub.score === null) return { text: "сдал (на проверке)", cls: "text-amber-600" };
    return { text: `${sub.score}%`, cls: sub.score >= 100 ? "text-green-600" : sub.score > 0 ? "text-amber-600" : "text-red-600" };
  }

  const doneCount = results.filter((r) => r.submission).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Radio className="h-5 w-5 text-red-500" />
            Занятие · {groupName}
          </h1>
          <p className="text-sm text-muted-foreground">{materialTitle}</p>
        </div>
        <LoadingButton variant="outline" loading={ending} onClick={end} className="text-destructive">
          <Square className="h-4 w-4" />
          Завершить занятие
        </LoadingButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        {/* Exercises — same Section → Lesson → Module → Item tree as in materials */}
        <aside className="h-fit rounded-lg border bg-card p-2 lg:sticky lg:top-4">
          <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">Упражнения</p>
          <ExerciseTree tree={tree} activeItemId={activeItemId} onSelect={selectItem} />
        </aside>

        {/* Active exercise with live drawing */}
        <main className="min-w-0">
          {activeItem ? (
            <PreviewProvider>
              <StudentItem
                key={activeItem.id}
                item={activeItem.item}
                drawingOverride={centerDrawing}
                saveDrawing={saveDrawing}
              />
            </PreviewProvider>
          ) : (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Выберите упражнение слева — оно откроется у всех учеников.
            </div>
          )}
        </main>

        {/* Live results */}
        <aside className="h-fit rounded-lg border bg-card p-3 lg:sticky lg:top-4">
          <p className="pb-2 text-xs font-semibold text-muted-foreground">
            Результаты · сдали {doneCount}/{results.length}
          </p>
          {!activeItem ? (
            <p className="text-xs text-muted-foreground">Нет активного упражнения.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => {
                const st = statusLabel(r.submission);
                const isOpen = expanded === r.studentId;
                return (
                  <li key={r.studentId} className="rounded border">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-sm"
                      onClick={() => setExpanded(isOpen ? null : r.studentId)}
                      disabled={!r.submission}
                    >
                      <span className="flex items-center gap-1 truncate">
                        {r.submission ? (isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span className="w-3.5" />}
                        <span className="truncate">{r.fullName}</span>
                      </span>
                      <span className={cn("shrink-0 text-xs font-medium", st.cls)}>{st.text}</span>
                    </button>
                    {isOpen && r.submission ? (
                      <div className="border-t p-2">
                        <PreviewProvider>
                          <StudentItem item={activeItem.item} submission={r.submission} drawingOverride={null} />
                        </PreviewProvider>
                      </div>
                    ) : null}
                  </li>
                );
              })}
              {results.length === 0 ? <li className="text-xs text-muted-foreground">В группе нет учеников.</li> : null}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
