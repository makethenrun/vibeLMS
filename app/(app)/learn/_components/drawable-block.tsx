"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Eraser, Pen, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Wraps any exercise block with a freehand drawing layer. Both tutors and
 * students can toggle the pencil to scribble over the task; the strokes are
 * local/ephemeral (a shared whiteboard for the lesson), not persisted.
 */
export function DrawableBlock({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  function fit() {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const r = w.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (c.width === Math.round(r.width) && c.height === Math.round(r.height)) return;
    // Preserve existing strokes across a resize.
    const snapshot = c.width && c.height ? c.getContext("2d")!.getImageData(0, 0, c.width, c.height) : null;
    c.width = Math.round(r.width);
    c.height = Math.round(r.height);
    if (snapshot) c.getContext("2d")!.putImageData(snapshot, 0, 0);
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
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
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
    drawing.current = false;
  }
  function clear() {
    const c = canvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
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
      <div className="absolute right-1 top-1 z-10 flex gap-1">
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
          </>
        ) : null}
      </div>
    </div>
  );
}
