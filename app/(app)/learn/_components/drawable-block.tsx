"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Check, Eraser, Loader2, Pen, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LiveDrawingOverlay } from "@/components/shared/live-drawing-overlay";
import { cn } from "@/lib/utils";

const PEN_COLORS = ["#ef4444", "#111827", "#2563eb", "#16a34a", "#eab308"];
const PEN_WIDTHS = [2, 4, 8];

/**
 * The fixed logical width of the drawing "stage" (in CSS px). The exercise
 * content and the drawing canvas both live in this fixed-width coordinate
 * space, which is then scaled to fit the available width. Because the layout
 * width never changes, text wraps identically on every monitor, so a stroke
 * drawn over a word stays over that word everywhere (word-level anchoring).
 * Wider containers are not upscaled (scale is capped at 1); narrower ones
 * (phones) scale the whole stage down.
 */
const STAGE_WIDTH = 720;

/**
 * Wraps any exercise block with a freehand drawing layer.
 *
 * - Without `onSave` (student/lesson use): strokes are local/ephemeral.
 * - With `onSave` (tutor authoring): the tutor draws over the student view and
 *   saves the annotation; `initial` preloads a previously saved drawing, which
 *   is also shown (read-only) to students.
 *
 * Drawings are resolution-independent: content + canvas render in a fixed
 * {@link STAGE_WIDTH} coordinate space scaled to fit, so both the exercise
 * layout and the annotation land identically on any screen.
 */
export function DrawableBlock({
  children,
  initial,
  onSave,
  autoSave = false,
  startActive,
  overlay,
}: {
  children: ReactNode;
  initial?: string | null;
  onSave?: (dataUrl: string | null) => void | Promise<void>;
  /** Persist on every stroke end (live), instead of via the ✓ button. */
  autoSave?: boolean;
  /** Whether drawing starts on (default: on when it can save, off otherwise). */
  startActive?: boolean;
  /**
   * A read-only drawing (PNG data URL) from someone else — e.g. the tutor's
   * live annotation shown to a student, or a student's drawing watched by the
   * tutor. Rendered over this same stage, so it lines up on any monitor.
   */
  overlay?: string | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const loadedInitial = useRef(false);
  const [active, setActive] = useState(startActive ?? Boolean(onSave));
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(3);
  const [saving, setSaving] = useState(false);
  // Scale that fits the fixed-width stage into the available width (≤ 1), and
  // the resulting host height (the stage's natural height × scale) that the
  // outer box must reserve since CSS transforms don't affect layout.
  const [scale, setScale] = useState(1);
  const [hostHeight, setHostHeight] = useState<number | null>(null);
  // Left offset that centers the (capped-width) stage on wide screens.
  const [offsetLeft, setOffsetLeft] = useState(0);

  function preload() {
    const c = canvasRef.current;
    if (!c || loadedInitial.current || !initial || !c.width || !c.height) return;
    loadedInitial.current = true;
    const img = new Image();
    img.onload = () => {
      // Draw at stage width, top-left, preserving the drawing's aspect ratio,
      // so a saved annotation lands in the same place/scale as it was drawn.
      const h = img.width ? Math.round(c.width * (img.height / img.width)) : c.height;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, h);
    };
    img.src = initial;
  }

  /**
   * Recompute the fit scale (from the host width) and the canvas backing store
   * (fixed stage width × the stage's natural height). Existing strokes are
   * preserved across a height change.
   */
  function relayout() {
    const host = hostRef.current;
    const stage = stageRef.current;
    const c = canvasRef.current;
    if (!host || !stage || !c) return;
    const hostWidth = host.clientWidth;
    if (!hostWidth) return;

    const nextScale = Math.min(1, hostWidth / STAGE_WIDTH);
    // offsetHeight ignores the CSS transform, i.e. it's the natural (unscaled)
    // stage height.
    const natural = stage.offsetHeight;
    if (!natural) return;

    setScale(nextScale);
    setHostHeight(Math.round(natural * nextScale));
    setOffsetLeft(Math.round(Math.max(0, (hostWidth - STAGE_WIDTH * nextScale) / 2)));

    const targetW = STAGE_WIDTH;
    const targetH = Math.round(natural);
    if (c.width !== targetW || c.height !== targetH) {
      const snapshot = c.width && c.height ? c.getContext("2d")!.getImageData(0, 0, c.width, c.height) : null;
      c.width = targetW;
      c.height = targetH;
      if (snapshot) c.getContext("2d")!.putImageData(snapshot, 0, 0);
      preload();
    } else {
      preload();
    }
  }

  useEffect(() => {
    relayout();
    const ro = new ResizeObserver(() => relayout());
    if (hostRef.current) ro.observe(hostRef.current);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map a pointer event to canvas (stage) coordinates. Using the ratio of the
  // backing store to the rendered (scaled) box makes this correct at any scale.
  function point(e: ReactPointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * c.width) / r.width,
      y: ((e.clientY - r.top) * c.height) / r.height,
    };
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
    <div ref={hostRef} className="relative" style={{ height: hostHeight ?? undefined }}>
      <div
        ref={stageRef}
        className="absolute top-0"
        style={{ left: offsetLeft, width: STAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 touch-none",
            active ? "cursor-crosshair" : "pointer-events-none",
          )}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
        />
        {overlay ? <LiveDrawingOverlay src={overlay} className="pointer-events-none z-[5]" /> : null}
      </div>
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
