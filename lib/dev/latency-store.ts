/**
 * TEMPORARY diagnostic store for click response-time measurements.
 * In-memory log mirrored to localStorage (debounced), with a tiny pub/sub so the
 * badge and the history tables re-render on new data. Remove this whole feature
 * (store + components + layout/settings usages) once the investigation is done.
 */

export interface LatencyRecord {
  id: string;
  ts: string; // ISO timestamp of the click
  t: number; // performance.now() at click, for ordering
  kind: "click" | "nav"; // click interaction vs. page transition
  path: string; // page the event happened on (for nav: the "from" page)
  role: string;
  label: string; // best human-readable name of what was clicked
  tag: string;
  text: string;
  aria: string;
  elId: string;
  x: number;
  y: number;
  rafMs: number; // click -> next animation frame (always captured)
  inputDelayMs: number | null; // Event Timing: processingStart - startTime
  processingMs: number | null; // Event Timing: processingEnd - processingStart
  durationMs: number | null; // Event Timing: full interaction duration
  toPath: string | null; // nav: destination page
  navMs: number | null; // nav: click -> destination rendered (ms)
}

const KEY = "vibe:latencyLog:v1";
const CAP = 3000;

let records: LatencyRecord[] = [];
let loaded = false;
let ctx = { role: "", login: "" };
const listeners = new Set<() => void>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function load(): void {
  if (loaded || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) records = JSON.parse(raw) as LatencyRecord[];
  } catch {
    records = [];
  }
  loaded = true;
}

function notify(): void {
  listeners.forEach((l) => l());
}

function scheduleFlush(): void {
  if (typeof window === "undefined") return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushNow, 800);
}

export function flushNow(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // ignore quota / disabled storage
  }
}

export function setLatencyContext(c: { role: string; login: string }): void {
  ctx = c;
}

export function getContext(): { role: string; login: string } {
  return ctx;
}

export function addRecord(r: LatencyRecord): string {
  load();
  records.push(r);
  if (records.length > CAP) records.splice(0, records.length - CAP);
  scheduleFlush();
  notify();
  return r.id;
}

export function updateRecord(id: string, patch: Partial<LatencyRecord>): void {
  const rec = records.find((x) => x.id === id);
  if (!rec) return;
  Object.assign(rec, patch);
  scheduleFlush();
  notify();
}

export function getRecords(): LatencyRecord[] {
  load();
  return records;
}

export function clearRecords(): void {
  records = [];
  flushNow();
  notify();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
