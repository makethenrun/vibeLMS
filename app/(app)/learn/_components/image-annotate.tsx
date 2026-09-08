"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormattedText } from "@/components/shared/formatted-text";
import { ImageZoom } from "@/components/shared/image-zoom";
import { cn } from "@/lib/utils";

const PEN_COLORS = ["#ef4444", "#111827", "#2563eb", "#16a34a", "#eab308"];
const PEN_WIDTHS = [2, 4, 8];

interface ImageLabel {
  text: string;
  x: number;
  y: number;
  opacity?: number;
  size?: number;
}

export function ImageAnnotate({
  url,
  caption,
  annotations,
  labels = [],
}: {
  url: string;
  caption: string | null;
  annotations?: string | null;
  labels?: ImageLabel[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [draw, setDraw] = useState(false);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(3);

  function resize() {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const r = w.getBoundingClientRect();
    if (r.width && r.height && (c.width !== Math.round(r.width) || c.height !== Math.round(r.height))) {
      c.width = Math.round(r.width);
      c.height = Math.round(r.height);
    }
  }

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function point(e: ReactPointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: ReactPointerEvent) {
    if (!draw) return;
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
  }
  function move(e: ReactPointerEvent) {
    if (!draw || !drawing.current) return;
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
    <div className="space-y-2 text-center">
      <div ref={wrapRef} className="relative inline-block max-w-full text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={caption ?? ""} onLoad={resize} className="block max-h-80 rounded-lg border" />
        {annotations ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={annotations} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
        ) : null}
        {labels.map((l, i) => (
          <span
            key={i}
            style={{ left: `${l.x}%`, top: `${l.y}%`, backgroundColor: `rgba(255,255,255,${(l.opacity ?? 100) / 100})`, fontSize: `${l.size ?? 16}px` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded px-1.5 py-0.5 font-semibold leading-tight text-black shadow-sm"
          >
            <FormattedText text={l.text} />
          </span>
        ))}
        <ImageZoom src={url} />
        <canvas
          ref={canvasRef}
          className={cn("absolute inset-0 h-full w-full touch-none", draw ? "cursor-crosshair" : "pointer-events-none")}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
        />
      </div>
      {caption ? <p className="text-sm text-muted-foreground"><FormattedText text={caption} /></p> : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" variant={draw ? "default" : "outline"} onClick={() => setDraw((d) => !d)}>
          <Pencil className="h-4 w-4" />
          {draw ? "Рисование включено" : "Рисовать пометки"}
        </Button>
        <Button size="sm" variant="outline" onClick={clear}>
          <Eraser className="h-4 w-4" />
          Очистить
        </Button>
        {draw ? (
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
      </div>
    </div>
  );
}
