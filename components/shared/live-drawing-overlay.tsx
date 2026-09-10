"use client";

import { useEffect, useState } from "react";

/**
 * A read-only drawing overlay (a PNG data URL) that swaps without flicker.
 *
 * Setting an <img> src to a new data URL blanks it while the browser decodes
 * the new image — so a live drawing appeared to "erase then redraw" on every
 * update. This preloads the next frame off-screen and only swaps the visible
 * image once it has fully loaded, keeping the previous frame until then.
 */
export function LiveDrawingOverlay({ src, className }: { src: string; className?: string }) {
  const [shown, setShown] = useState(src);

  useEffect(() => {
    if (src === shown) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setShown(src); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src, shown]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={shown} alt="" aria-hidden className={className} />;
}
