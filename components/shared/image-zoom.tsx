"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Expand button that opens the image full-screen. By default it's an overlay in
 * the corner of the image's (relative) container; pass `inline` to render it as a
 * standalone button (e.g. in the gutter beside the image). Stops pointer/click
 * propagation so it never triggers the surrounding exercise (drag, card flip, …).
 */
export function ImageZoom({ src, className, inline = false }: { src: string; className?: string; inline?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        className={cn(
          inline
            ? "rounded-md border bg-background p-1.5 text-muted-foreground hover:bg-accent"
            : "absolute right-1 top-1 z-20 rounded-md bg-black/50 p-1 text-white hover:bg-black/70",
          className,
        )}
        aria-label="Увеличить"
        title="Увеличить"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </>
  );
}
