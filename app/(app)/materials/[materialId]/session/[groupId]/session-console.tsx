"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Radio, Square } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import { PreviewProvider } from "@/app/(app)/learn/_components/preview-provider";
import { StudentItem } from "@/app/(app)/learn/_components/student-item";
import { cn } from "@/lib/utils";
import { itemsForScope, type ScopeKind, type TreeSection } from "@/lib/materials/scope";
import type { ItemRow, ItemSubmissionRow } from "@/types";
import type { SessionResultRow, SessionState } from "@/services/materials/live-session.service";
import {
  endSessionAction,
  pollSessionResultsAction,
  setActiveScopeAction,
  setSessionDrawingAction,
} from "@/app/(app)/live/actions";
import { ExerciseTree } from "./exercise-tree";

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
  items: { id: string; item: ItemRow }[];
  tree: TreeSection[];
  students: { id: string; fullName: string }[];
  initialState: SessionState;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<{ kind: ScopeKind; id: string | null }>({ kind: initialState.kind, id: initialState.scopeId });
  const [centerDrawing, setCenterDrawing] = useState<string | null>(initialState.drawing);
  const [results, setResults] = useState<SessionResultRow[]>(
    students.map((s) => ({ studentId: s.id, fullName: s.fullName, submissions: {} })),
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const polling = useRef(false);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i.item])), [items]);
  const scopeItemIds = useMemo(() => itemsForScope(tree, scope.kind, scope.id), [tree, scope]);
  const singleItem = scope.kind === "item" && scopeItemIds.length === 1;

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

  async function selectScope(kind: ScopeKind, id: string) {
    setScope({ kind, id });
    setCenterDrawing(null);
    const res = await setActiveScopeAction(sessionId, kind, id);
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

  function badge(sub: ItemSubmissionRow | undefined): { text: string; cls: string } {
    if (!sub) return { text: "—", cls: "bg-muted text-muted-foreground" };
    if (sub.score === null) return { text: "✓", cls: "bg-amber-100 text-amber-700" };
    return {
      text: `${sub.score}%`,
      cls: sub.score >= 100 ? "bg-green-100 text-green-700" : sub.score > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700",
    };
  }

  const doneCount = results.filter((r) => scopeItemIds.every((id) => r.submissions[id])).length;

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

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        {/* Exercises — same Section → Lesson → Module → Item tree as in materials */}
        <aside className="h-fit rounded-lg border bg-card p-2 lg:sticky lg:top-4">
          <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">Упражнения</p>
          <ExerciseTree tree={tree} activeKind={scope.kind} activeId={scope.id} onSelect={selectScope} />
        </aside>

        {/* Active scope: one or many exercises; draw only on a single exercise */}
        <main className="min-w-0 space-y-4">
          {scopeItemIds.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Выберите упражнение, модуль, урок или раздел слева — он откроется у всех учеников.
            </div>
          ) : (
            <PreviewProvider>
              {scopeItemIds.map((id) => {
                const item = itemById.get(id);
                if (!item) return null;
                return singleItem ? (
                  <StudentItem key={id} item={item} drawingOverride={centerDrawing} saveDrawing={saveDrawing} />
                ) : (
                  <StudentItem key={id} item={item} drawingOverride={null} />
                );
              })}
            </PreviewProvider>
          )}
        </main>

        {/* Live results */}
        <aside className="h-fit rounded-lg border bg-card p-3 lg:sticky lg:top-4">
          <p className="pb-2 text-xs font-semibold text-muted-foreground">
            Результаты · выполнили {doneCount}/{results.length}
          </p>
          {scopeItemIds.length === 0 ? (
            <p className="text-xs text-muted-foreground">Нет активного упражнения.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => {
                const isOpen = expanded === r.studentId;
                const hasAny = scopeItemIds.some((id) => r.submissions[id]);
                return (
                  <li key={r.studentId} className="rounded border">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-sm"
                      onClick={() => setExpanded(isOpen ? null : r.studentId)}
                      disabled={!hasAny}
                    >
                      <span className="flex items-center gap-1 truncate">
                        {hasAny ? (isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span className="w-3.5" />}
                        <span className="truncate">{r.fullName}</span>
                      </span>
                      <span className="flex shrink-0 flex-wrap justify-end gap-0.5">
                        {scopeItemIds.map((id) => {
                          const b = badge(r.submissions[id]);
                          return <span key={id} className={cn("rounded px-1 text-[10px] font-medium leading-4", b.cls)}>{b.text}</span>;
                        })}
                      </span>
                    </button>
                    {isOpen && hasAny ? (
                      <div className="space-y-2 border-t p-2">
                        <PreviewProvider>
                          {scopeItemIds.map((id) => {
                            const item = itemById.get(id);
                            return item ? <StudentItem key={id} item={item} submission={r.submissions[id]} drawingOverride={null} /> : null;
                          })}
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
