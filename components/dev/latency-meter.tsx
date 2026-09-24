"use client";

import { useEffect, useReducer, useState } from "react";
import { Timer, X } from "lucide-react";

import { LatencyHistory } from "./latency-history";
import {
  addRecord,
  flushNow,
  getRecords,
  setLatencyContext,
  subscribe,
  updateRecord,
  type LatencyRecord,
} from "@/lib/dev/latency-store";

interface EventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

/** Best human-readable description of the element that was clicked. */
function describe(target: EventTarget | null): { label: string; tag: string; text: string; aria: string; elId: string } {
  const el = target as Element | null;
  const empty = { label: "—", tag: "—", text: "", aria: "", elId: "" };
  if (!el || !el.closest) return empty;
  const node =
    (el.closest('button, a, [role="button"], input, select, textarea, label, [data-testid]') as HTMLElement | null) ??
    (el as HTMLElement);
  const tag = node.tagName.toLowerCase();
  const text = (node.innerText || (node as HTMLInputElement).value || "").trim().replace(/\s+/g, " ").slice(0, 60);
  const aria = node.getAttribute("aria-label") ?? "";
  const elId = node.id ?? "";
  const label = text || aria || node.getAttribute("data-testid") || elId || tag;
  return { label, tag, text, aria, elId };
}

/**
 * TEMPORARY floating badge that measures click response time for every role and
 * logs what/where was clicked. Click the badge to open the full history + export.
 */
export function LatencyMeter({ role, login }: { role: string; login: string | null }) {
  const [open, setOpen] = useState(false);
  const [, force] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    setLatencyContext({ role, login: login ?? "" });
    if (typeof window === "undefined") return;

    // eventTs(rounded) -> record id, to correlate Event Timing entries with clicks.
    const pending = new Map<number, string>();

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      // Don't log interactions with the meter's own UI.
      if (target && target.closest?.("[data-latency-ui]")) return;

      const t0 = performance.now();
      const info = describe(e.target);
      const id = newId();
      const rec: LatencyRecord = {
        id,
        ts: new Date().toISOString(),
        t: t0,
        path: window.location.pathname,
        role,
        ...info,
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        rafMs: 0,
        inputDelayMs: null,
        processingMs: null,
        durationMs: null,
      };
      addRecord(rec);

      const key = Math.round(e.timeStamp);
      pending.set(key, id);
      // Drop stale correlation keys after a while.
      window.setTimeout(() => pending.delete(key), 4000);

      requestAnimationFrame(() => {
        updateRecord(id, { rafMs: Math.round(performance.now() - t0) });
      });
    }

    document.addEventListener("click", onClick, true);

    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as EventTiming[]) {
          if (entry.name !== "click") continue;
          const key = Math.round(entry.startTime);
          let id = pending.get(key);
          if (!id) {
            for (const [k, v] of pending) {
              if (Math.abs(k - key) <= 4) {
                id = v;
                break;
              }
            }
          }
          if (id) {
            updateRecord(id, {
              inputDelayMs: Math.round(entry.processingStart - entry.startTime),
              processingMs: Math.round(entry.processingEnd - entry.processingStart),
              durationMs: Math.round(entry.duration),
            });
            pending.delete(key);
          }
        }
      });
      observer.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {
      // Event Timing not supported — rafMs still recorded.
    }

    const onHide = () => flushNow();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    const unsub = subscribe(() => force());

    return () => {
      document.removeEventListener("click", onClick, true);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
      unsub();
      flushNow();
    };
  }, [role, login]);

  const records = getRecords();
  const last = records[records.length - 1];
  const lastMs = last ? (last.durationMs ?? last.rafMs) : null;

  return (
    <div data-latency-ui className="fixed bottom-3 left-3 z-[9999] text-sm">
      {open ? (
        <div className="w-[min(92vw,44rem)] rounded-lg border bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Диагностика откликов</p>
            <button onClick={() => setOpen(false)} aria-label="Свернуть" className="rounded p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
          <LatencyHistory compact />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-lg hover:bg-accent"
          title="Открыть историю откликов"
        >
          <Timer className="h-4 w-4 text-primary" />
          <span className="tabular-nums">{lastMs === null ? "—" : `${lastMs} ms`}</span>
          <span className="text-xs text-muted-foreground">({records.length})</span>
        </button>
      )}
    </div>
  );
}
