import type { CSSProperties, ReactNode } from "react";

export interface LessonBackgroundView {
  url: string | null;
  dim: number;
  fit: "cover" | "contain" | "tile";
  position: "top" | "center" | "bottom";
  scale: number;
}

function bgStyle(bg: LessonBackgroundView): CSSProperties {
  // `fixed` keeps the picture pinned to the viewport — it doesn't scroll away.
  const base: CSSProperties = { backgroundImage: `url("${bg.url}")`, backgroundPosition: `center ${bg.position}`, backgroundAttachment: "fixed" };
  if (bg.fit === "tile") return { ...base, backgroundRepeat: "repeat", backgroundSize: `${bg.scale}%` };
  return { ...base, backgroundRepeat: "no-repeat", backgroundSize: bg.fit };
}

/**
 * Paints an optional lesson background behind the whole page, edge to edge.
 * `header` (title) sits in a white block; `actions` float over the background;
 * `topSlot` (e.g. breadcrumbs) renders above them. `dim` (0..80) darkens it.
 */
export function LessonSurface({
  background,
  header,
  actions,
  topSlot,
  children,
}: {
  background: LessonBackgroundView;
  header?: ReactNode;
  actions?: ReactNode;
  topSlot?: ReactNode;
  children: ReactNode;
}) {
  if (!background.url) {
    return (
      <div className="space-y-6">
        {topSlot}
        {header || actions ? (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>{header}</div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    );
  }

  const bar = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      {header ? <div className="rounded-lg bg-card/95 p-4 shadow-sm">{header}</div> : <div />}
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );

  return (
    // Full-bleed: escape the main content padding so the background reaches the edges.
    <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={bgStyle(background)} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${Math.min(80, Math.max(0, background.dim)) / 100})` }}
      />
      <div className="relative space-y-6 p-4 md:p-6">
        {topSlot}
        {bar}
        {children}
      </div>
    </div>
  );
}
