"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Hand, MonitorPlay, Pin, PinOff, Radio, Square, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { PreviewProvider } from "@/app/(app)/learn/_components/preview-provider";
import { StudentItem } from "@/app/(app)/learn/_components/student-item";
import { cn } from "@/lib/utils";
import { flatModules, itemsForScope, lessonIdForScope, moduleIdForScope, type ScopeKind, type TreeSection } from "@/lib/materials/scope";
import type { ItemRow, ItemSubmissionRow } from "@/types";
import type { RaisedHand, SessionResultRow, SessionState } from "@/services/materials/live-session.service";
import {
  clearHandsAction,
  endSessionAction,
  pollSessionResultsAction,
  saveTutorDrawingAction,
  setActiveScopeAction,
  setFocusedItemAction,
} from "@/app/(app)/live/actions";
import { ExerciseTree } from "./exercise-tree";
import { FreeAnswerEditor } from "./free-answer-editor";

/** Down-arrow quick jump: pick a lesson to make it the active scope. */
function ScopeJump({ tree, onPick }: { tree: TreeSection[]; onPick: (lessonId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
        aria-label="Быстрый переход"
        aria-expanded={open}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute left-0 top-8 z-50 max-h-[70vh] w-72 overflow-y-auto rounded-lg border bg-popover p-1 text-sm shadow-md">
          {tree.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Нет разделов.</p>
          ) : (
            tree.map((section) => {
              const isOpen = expanded[section.id] ?? false;
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => ({ ...p, [section.id]: !isOpen }))}
                    className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left font-medium hover:bg-accent"
                  >
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{section.title}</span>
                  </button>
                  {isOpen ? (
                    <ul className="pb-1 pl-6">
                      {section.lessons.length === 0 ? (
                        <li className="px-2 py-1 text-xs text-muted-foreground">Нет уроков</li>
                      ) : (
                        section.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              onClick={() => { onPick(lesson.id); setOpen(false); }}
                              className="block w-full truncate rounded px-2 py-1 text-left text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              {lesson.title}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
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
  // What students currently see (broadcast, synced to the server) vs. the tutor's
  // own local view (tree navigation, scrolls within the lesson — not broadcast).
  const [broadcast, setBroadcast] = useState<{ kind: ScopeKind; id: string | null }>({ kind: initialState.kind, id: initialState.scopeId });
  const [viewScope, setViewScope] = useState<{ kind: ScopeKind; id: string | null }>({ kind: initialState.kind, id: initialState.scopeId });
  const [focusedItemId, setFocusedItemId] = useState<string | null>(initialState.focusedItemId);
  const pendingScrollRef = useRef<string | null>(null);
  const [results, setResults] = useState<SessionResultRow[]>(
    students.map((s) => ({ studentId: s.id, fullName: s.fullName, submissions: {} })),
  );
  const [tutorDrawings, setTutorDrawings] = useState<Record<string, string>>(initialTutorDrawings);
  const [watchDrawings, setWatchDrawings] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [hands, setHands] = useState<RaisedHand[]>([]);
  const [handsOpen, setHandsOpen] = useState(false);
  const polling = useRef(false);
  const expandedRef = useRef<string | null>(null);
  expandedRef.current = expanded;
  const handIdsRef = useRef<Set<string>>(new Set());

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i.item])), [items]);
  const viewItemIds = useMemo(() => itemsForScope(tree, viewScope.kind, viewScope.id), [tree, viewScope]);
  const broadcastItemIds = useMemo(() => itemsForScope(tree, broadcast.kind, broadcast.id), [tree, broadcast]);

  // Module prev/next across the whole material (crosses lesson boundaries).
  const flatMods = useMemo(() => flatModules(tree), [tree]);
  const currentModuleId = moduleIdForScope(tree, viewScope.kind, viewScope.id);
  const moduleIdx = flatMods.findIndex((mod) => mod.id === currentModuleId);
  const prevMod = moduleIdx > 0 ? flatMods[moduleIdx - 1] : null;
  const nextMod = moduleIdx >= 0 && moduleIdx < flatMods.length - 1 ? flatMods[moduleIdx + 1] : null;

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
        // Toast newly raised hands (ids not seen on the previous poll).
        const seen = handIdsRef.current;
        for (const h of res.data.hands) {
          if (!seen.has(h.studentId)) toast(`✋ ${h.fullName} поднял(а) руку`);
        }
        handIdsRef.current = new Set(res.data.hands.map((h) => h.studentId));
        setHands(res.data.hands);
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

  // Tutor navigates their own view; for an exercise, open its lesson and scroll to it.
  function navigate(kind: ScopeKind, id: string) {
    if (kind === "item") {
      const lessonId = lessonIdForScope(tree, "item", id);
      pendingScrollRef.current = id;
      setViewScope(lessonId ? { kind: "lesson", id: lessonId } : { kind: "item", id });
    } else {
      setViewScope({ kind, id });
    }
  }

  // Broadcast a lesson to the students (what they see now).
  async function broadcastScope(kind: ScopeKind, id: string) {
    setBroadcast({ kind, id });
    setFocusedItemId(null);
    const res = await setActiveScopeAction(sessionId, kind, id);
    if (!res.success) toast.error(res.error);
    void setFocusedItemAction(sessionId, null);
  }

  // Scroll the students to a specific exercise within what they currently see.
  async function toggleFocus(itemId: string) {
    const next = focusedItemId === itemId ? null : itemId;
    setFocusedItemId(next);
    const res = await setFocusedItemAction(sessionId, next);
    if (!res.success) toast.error(res.error);
  }

  // After a view change requested a scroll, jump to that exercise within the lesson.
  useEffect(() => {
    const id = pendingScrollRef.current;
    if (!id) return;
    pendingScrollRef.current = null;
    requestAnimationFrame(() => document.getElementById(`item-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [viewItemIds]);

  async function saveTutorDrawing(itemId: string, dataUrl: string | null) {
    const res = await saveTutorDrawingAction(sessionId, itemId, dataUrl);
    if (!res.success) toast.error(res.error);
  }

  async function clearHand(studentId: string) {
    setHands((prev) => prev.filter((h) => h.studentId !== studentId));
    handIdsRef.current.delete(studentId);
    await clearHandsAction(sessionId, studentId);
  }

  async function clearAllHands() {
    setHands([]);
    handIdsRef.current = new Set();
    setHandsOpen(false);
    await clearHandsAction(sessionId);
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

  const doneCount = results.filter((r) => broadcastItemIds.length > 0 && broadcastItemIds.every((id) => r.submissions[id])).length;

  const moduleNavBar =
    moduleIdx !== -1 && flatMods.length > 1 ? (
      <div className="flex items-center justify-between gap-2">
        {prevMod ? (
          <Button variant="outline" size="sm" className="max-w-[45%]" onClick={() => navigate("module", prevMod.id)}>
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{prevMod.title}</span>
          </Button>
        ) : (
          <span />
        )}
        {nextMod ? (
          <Button variant="outline" size="sm" className="max-w-[45%]" onClick={() => navigate("module", nextMod.id)}>
            <span className="truncate">{nextMod.title}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Button>
        ) : (
          <span />
        )}
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1">
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Radio className="h-5 w-5 text-red-500" />
              Занятие · {groupName}
            </h1>
            <ScopeJump tree={tree} onPick={(lessonId) => navigate("lesson", lessonId)} />
          </div>
          <p className="text-sm text-muted-foreground">{materialTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant={handsOpen ? "default" : "outline"} onClick={() => setHandsOpen((o) => !o)}>
              <Hand className="h-4 w-4" />
              Уведомления
              {hands.length > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                  {hands.length}
                </span>
              ) : null}
            </Button>
            {handsOpen ? (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border bg-popover p-2 shadow-md">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold">Поднятые руки</p>
                  {hands.length > 0 ? (
                    <button type="button" onClick={clearAllHands} className="text-xs text-muted-foreground hover:text-foreground">
                      Очистить все
                    </button>
                  ) : null}
                </div>
                {hands.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">Никто не поднял руку.</p>
                ) : (
                  <ul className="space-y-0.5">
                    {hands.map((h) => (
                      <li key={h.studentId} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                        <span className="flex items-center gap-1 truncate">
                          <Hand className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="truncate">{h.fullName}</span>
                        </span>
                        <button type="button" onClick={() => clearHand(h.studentId)} className="shrink-0 rounded p-0.5 hover:bg-background" aria-label="Убрать">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
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
          <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground">Упражнения</p>
          <p className="px-2 pb-2 text-[11px] leading-tight text-muted-foreground">
            Нажмите на упражнение — вы перейдёте к нему. Иконка{" "}
            <MonitorPlay className="inline h-3 w-3 align-[-1px]" /> у урока открывает этот урок ученикам.
          </p>
          <ExerciseTree
            tree={tree}
            viewKind={viewScope.kind}
            viewId={viewScope.id}
            liveKind={broadcast.kind}
            liveId={broadcast.id}
            onNavigate={navigate}
            onBroadcast={broadcastScope}
          />
        </aside>

        {/* Active scope: exercises with the "pin to students" control and live drawing */}
        <main className="min-w-0 space-y-4">
          {moduleNavBar}
          {viewItemIds.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Выберите раздел, урок, модуль или упражнение слева, чтобы открыть его у себя. Значок{" "}
              <MonitorPlay className="inline h-4 w-4 align-[-2px]" /> напротив урока откроет его ученикам.
            </div>
          ) : (
            <PreviewProvider>
              {viewItemIds.map((id) => {
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
          {viewItemIds.length > 0 ? moduleNavBar : null}
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
                {broadcastItemIds.length === 0 ? (
            <p className="text-xs text-muted-foreground">Нет активного упражнения.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => {
                const isOpen = expanded === r.studentId;
                const hasAny = broadcastItemIds.some((id) => r.submissions[id]);
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
                        {broadcastItemIds.map((id) => {
                          const b = badge(r.submissions[id]);
                          return <span key={id} className={cn("rounded px-1 text-[10px] font-medium leading-4", b.cls)}>{b.text}</span>;
                        })}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="space-y-2 border-t p-2">
                        {hasAny || Object.keys(watchDrawings).length > 0 ? (
                          <PreviewProvider>
                            {broadcastItemIds.map((id) => {
                              const item = itemById.get(id);
                              if (!item) return null;
                              const sub = r.submissions[id];
                              return (
                                <div key={id} className="space-y-2">
                                  <div className="relative">
                                    <StudentItem item={item} submission={sub} drawingOverride={null} overlay={watchDrawings[id] ?? null} />
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
