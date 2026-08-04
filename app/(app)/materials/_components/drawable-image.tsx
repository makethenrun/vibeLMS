"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Draw freehand annotations over an image and emit them as a PNG data URL.
 * The canvas matches the rendered image box, so the saved overlay lines up
 * when displayed at the same size.
 */
export function DrawableImage({
  url,
  value,
  onChange,
}: {
  url: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const loadedValue = useRef<string | null>(null);

  function fit() {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const r = w.getBoundingClientRect();
    if (r.width && r.height && (c.width !== Math.round(r.width) || c.height !== Math.round(r.height))) {
      c.width = Math.round(r.width);
      c.height = Math.round(r.height);
      redraw();
    }
  }

  function redraw() {
    const c = canvasRef.current;
    if (!c || !value || loadedValue.current === value) return;
    const ctx = c.getContext("2d")!;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
    img.src = value;
    loadedValue.current = value;
  }

  useEffect(() => {
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function point(e: ReactPointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: ReactPointerEvent) {
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
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function stop() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current!.toDataURL("image/png"));
  }
  function clear() {
    const c = canvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    loadedValue.current = null;
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div ref={wrapRef} className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" onLoad={fit} className="block max-h-80 rounded-lg border" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
        />
      </div>
      <Button size="sm" variant="outline" onClick={clear}>
        <Eraser className="h-4 w-4" />
        Стереть пометки
      </Button>
    </div>
  );
}
