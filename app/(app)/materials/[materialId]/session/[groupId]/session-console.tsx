"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Pin, PinOff, Radio, Square, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  saveTutorDrawingAction,
  setActiveScopeAction,
  setFocusedItemAction,
} from "@/app/(app)/live/actions";
import { ExerciseTree } from "./exercise-tree";
import { FreeAnswerEditor } from "./free-answer-editor";

export function SessionConsole({
  sessionId,
  materialTitle,
  groupName,
  groupId,
  items,
  tree,
  students,
  initialState,
  initialTutorDrawings,
}: {
  sessionId: string;
  materialTitle: string;
  groupName: string;
  groupId: string;
  items: { id: string; item: ItemRow }[];
  tree: TreeSection[];
  students: { id: string; fullName: string }[];
  initialState: SessionState;
  initialTutorDrawings: Record<string, string>;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<{ kind: ScopeKind; id: string | null }>({ kind: initialState.kind, id: initialState.scopeId });
  const [focusedItemId, setFocusedItemId] = useState<string | null>(initialState.focusedItemId);
  const [results, setResults] = useState<SessionResultRow[]>(
    students.map((s) => ({ studentId: s.id, fullName: s.fullName, submissions: {} })),
  );
  const [tutorDrawings, setTutorDrawings] = useState<Record<string, string>>(initialTutorDrawings);
  const [watchDrawings, setWatchDrawings] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const polling = useRef(false);
  const expandedRef = useRef<string | null>(null);
  expandedRef.current = expanded;

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i.item])), [items]);
  const scopeItemIds = useMemo(() => itemsForScope(tree, scope.kind, scope.id), [tree, scope]);

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const res = await pollSessionResultsAction(sessionId, expandedRef.current ?? undefined);
      if (res.success) {
        setResults(res.data.results);
        setTutorDrawings(res.data.tutorDrawings);
        setWatchDrawings(res.data.watchDrawings);
        setFocusedItemId(res.data.state.focusedItemId);
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
    setFocusedItemId(null);
    const res = await setActiveScopeAction(sessionId, kind, id);
    if (!res.success) toast.error(res.error);
  }

  async function toggleFocus(itemId: string) {
    const next = focusedItemId === itemId ? null : itemId;
    setFocusedItemId(next);
    const res = await setFocusedItemAction(sessionId, next);
    if (!res.success) toast.error(res.error);
  }

  async function saveTutorDrawing(itemId: string, dataUrl: string | null) {
    const res = await saveTutorDrawingAction(sessionId, itemId, dataUrl);
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

  const doneCount = results.filter((r) => scopeItemIds.length > 0 && scopeItemIds.every((id) => r.submissions[id])).length;

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
        <div className="flex items-center gap-2">
          <Button variant={resultsOpen ? "default" : "outline"} onClick={() => setResultsOpen((o) => !o)}>
            <Users className="h-4 w-4" />
            Результаты · {doneCount}/{results.length}
          </Button>
          <LoadingButton variant="outline" loading={ending} onClick={end} className="text-destructive">
            <Square className="h-4 w-4" />
            Завершить занятие
          </LoadingButton>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Exercises tree */}
        <aside className="h-fit rounded-lg border bg-card p-2 lg:sticky lg:top-4">
          <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">Упражнения</p>
          <ExerciseTree tree={tree} activeKind={scope.kind} activeId={scope.id} onSelect={selectScope} />
        </aside>

        {/* Active scope: exercises with the "pin to students" control and live drawing */}
        <main className="min-w-0 space-y-4">
          {scopeItemIds.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Выберите раздел, урок, модуль или упражнение слева — оно откроется у всех учеников.
            </div>
          ) : (
            <PreviewProvider>
              {scopeItemIds.map((id) => {
                const item = itemById.get(id);
                if (!item) return null;
                const focused = focusedItemId === id;
                return (
                  <div key={id} className={cn("rounded-lg", focused && "ring-2 ring-primary ring-offset-2")}>
                    <div className="mb-1 flex justify-end">
                      <Button size="sm" variant={focused ? "default" : "outline"} onClick={() => toggleFocus(id)}>
                        {focused ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        {focused ? "Откреплено" : "Показать всем"}
                      </Button>
                    </div>
                    <StudentItem
                      item={item}
                      drawingOverride={tutorDrawings[id] ?? null}
                      saveDrawing={(d) => saveTutorDrawing(id, d)}
                      liveDraw
                      drawStartActive
                    />
                  </div>
                );
              })}
            </PreviewProvider>
          )}
        </main>

        {/* Live results — wide slide-over toggled from the header */}
        {resultsOpen ? (
          <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setResultsOpen(false)} aria-hidden />
            <aside className="fixed bottom-0 right-0 top-14 z-50 flex w-[min(760px,calc(100vw-4rem))] flex-col border-l bg-card shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <p className="text-sm font-semibold">Результаты · выполнили {doneCount}/{results.length}</p>
                <button type="button" onClick={() => setResultsOpen(false)} aria-label="Закрыть" className="rounded p-1 hover:bg-accent">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
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
                      onClick={() => { setWatchDrawings({}); setExpanded(isOpen ? null : r.studentId); }}
                    >
                      <span className="flex items-center gap-1 truncate">
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <span className="truncate">{r.fullName}</span>
                      </span>
                      <span className="flex shrink-0 flex-wrap justify-end gap-0.5">
                        {scopeItemIds.map((id) => {
                          const b = badge(r.submissions[id]);
                          return <span key={id} className={cn("rounded px-1 text-[10px] font-medium leading-4", b.cls)}>{b.text}</span>;
                        })}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="space-y-2 border-t p-2">
                        {hasAny || Object.keys(watchDrawings).length > 0 ? (
                          <PreviewProvider>
                            {scopeItemIds.map((id) => {
                              const item = itemById.get(id);
                              if (!item) return null;
                              const sub = r.submissions[id];
                              return (
                                <div key={id} className="space-y-2">
                                  <div className="relative">
                                    <StudentItem item={item} submission={sub} drawingOverride={null} />
                                    {watchDrawings[id] ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={watchDrawings[id]} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                                    ) : null}
                                  </div>
                                  {item.type === "FREE" && sub ? (
                                    <FreeAnswerEditor
                                      studentId={r.studentId}
                                      itemId={id}
                                      initial={sub.edited_answer ?? ((sub.answer as { text?: string })?.text ?? "")}
                                    />
                                  ) : null}
                                </div>
                              );
                            })}
                          </PreviewProvider>
                        ) : (
                          <p className="text-xs text-muted-foreground">Ученик ещё ничего не сделал.</p>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
                  {results.length === 0 ? <li className="text-xs text-muted-foreground">В группе нет учеников.</li> : null}
                </ul>
                )}
              </div>
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
