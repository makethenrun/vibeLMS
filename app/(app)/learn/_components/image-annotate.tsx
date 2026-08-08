"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormattedText } from "@/components/shared/formatted-text";
import { cn } from "@/lib/utils";

export function ImageAnnotate({
  url,
  caption,
  annotations,
}: {
  url: string;
  caption: string | null;
  annotations?: string | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [draw, setDraw] = useState(false);

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
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
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
    <div className="space-y-2">
      <div ref={wrapRef} className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={caption ?? ""} onLoad={resize} className="block max-h-80 rounded-lg border" />
        {annotations ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={annotations} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
        ) : null}
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
      <div className="flex gap-2">
        <Button size="sm" variant={draw ? "default" : "outline"} onClick={() => setDraw((d) => !d)}>
          <Pencil className="h-4 w-4" />
          {draw ? "Рисование включено" : "Рисовать пометки"}
        </Button>
        <Button size="sm" variant="outline" onClick={clear}>
          <Eraser className="h-4 w-4" />
          Очистить
        </Button>
      </div>
    </div>
  );
}
