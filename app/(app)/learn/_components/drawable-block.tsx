"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Check, Eraser, Loader2, Pen, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PEN_COLORS = ["#ef4444", "#111827", "#2563eb", "#16a34a", "#eab308"];
const PEN_WIDTHS = [2, 4, 8];

/**
 * Wraps any exercise block with a freehand drawing layer.
 *
 * - Without `onSave` (student/lesson use): strokes are local/ephemeral.
 * - With `onSave` (tutor authoring): the tutor draws over the student view and
 *   saves the annotation; `initial` preloads a previously saved drawing, which
 *   is also shown (read-only) to students.
 */
export function DrawableBlock({
  children,
  initial,
  onSave,
  autoSave = false,
  startActive,
}: {
  children: ReactNode;
  initial?: string | null;
  onSave?: (dataUrl: string | null) => void | Promise<void>;
  /** Persist on every stroke end (live), instead of via the ✓ button. */
  autoSave?: boolean;
  /** Whether drawing starts on (default: on when it can save, off otherwise). */
  startActive?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const loadedInitial = useRef(false);
  const [active, setActive] = useState(startActive ?? Boolean(onSave));
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(3);
  const [saving, setSaving] = useState(false);

  function preload() {
    const c = canvasRef.current;
    if (!c || loadedInitial.current || !initial || !c.width || !c.height) return;
    loadedInitial.current = true;
    const img = new Image();
    img.onload = () => c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    img.src = initial;
  }

  function fit() {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const r = w.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (c.width === Math.round(r.width) && c.height === Math.round(r.height)) {
      preload();
      return;
    }
    // Preserve existing strokes across a resize.
    const snapshot = c.width && c.height ? c.getContext("2d")!.getImageData(0, 0, c.width, c.height) : null;
    c.width = Math.round(r.width);
    c.height = Math.round(r.height);
    if (snapshot) c.getContext("2d")!.putImageData(snapshot, 0, 0);
    preload();
  }

  useEffect(() => {
    fit();
    const ro = new ResizeObserver(() => fit());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function point(e: ReactPointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: ReactPointerEvent) {
    if (!active) return;
    drawing.current = true;
    canvasRef.current!.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 24;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
    }
  }
  function move(e: ReactPointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function stop() {
    if (!drawing.current) return;
    drawing.current = false;
    if (autoSave && onSave && canvasRef.current) void onSave(canvasRef.current.toDataURL("image/png"));
  }
  function clear() {
    const c = canvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    loadedInitial.current = true; // don't re-draw the old initial after clearing
    if (onSave) void onSave(null);
  }

  async function save() {
    const c = canvasRef.current;
    if (!c || !onSave) return;
    setSaving(true);
    try {
      await onSave(c.toDataURL("image/png"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      {children}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full touch-none",
          active ? "cursor-crosshair" : "pointer-events-none",
        )}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
      />
      <div className="absolute right-1 top-1 z-10 flex flex-wrap justify-end gap-1">
        <Button
          size="icon"
          variant={active ? "default" : "outline"}
          className="h-7 w-7 opacity-70 hover:opacity-100"
          title={active ? "Выключить рисование" : "Рисовать поверх задания"}
          aria-label="Рисование"
          onClick={() => setActive((a) => !a)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {active ? (
          <>
            {tool === "pen" ? (
              <>
                {PEN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn("h-7 w-7 rounded-full border bg-white p-1", color === c && "ring-2 ring-offset-1")}
                    style={{ borderColor: c }}
                    title="Цвет"
                    aria-label={`Цвет ${c}`}
                  >
                    <span className="block h-full w-full rounded-full" style={{ backgroundColor: c }} />
                  </button>
                ))}
                {PEN_WIDTHS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWidth(w)}
                    className={cn("flex h-7 w-7 items-center justify-center rounded-md border bg-white", width === w && "ring-2 ring-offset-1")}
                    title={`Толщина ${w}`}
                    aria-label={`Толщина ${w}`}
                  >
                    <span className="rounded-full bg-black" style={{ width: w + 2, height: w + 2 }} />
                  </button>
                ))}
              </>
            ) : null}
            <Button
              size="icon"
              variant={tool === "pen" ? "default" : "outline"}
              className="h-7 w-7 opacity-70 hover:opacity-100"
              title="Карандаш"
              aria-label="Карандаш"
              onClick={() => setTool("pen")}
            >
              <Pen className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={tool === "eraser" ? "default" : "outline"}
              className="h-7 w-7 opacity-70 hover:opacity-100"
              title="Ластик"
              aria-label="Ластик"
              onClick={() => setTool("eraser")}
            >
              <Eraser className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 opacity-70 hover:opacity-100"
              title="Очистить всё"
              aria-label="Очистить"
              onClick={clear}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {onSave && !autoSave ? (
              <Button
                size="icon"
                variant="default"
                className="h-7 w-7"
                title="Сохранить рисунок"
                aria-label="Сохранить рисунок"
                onClick={save}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
