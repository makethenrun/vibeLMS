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
 * Paints an optional lesson background behind the whole page. Header and module
 * heading are placed in white blocks (via `header`) so they read over it.
 * `dim` (0..80) darkens the image. With no background it renders plainly.
 */
export function LessonSurface({
  background,
  header,
  children,
}: {
  background: LessonBackgroundView;
  header?: ReactNode;
  children: ReactNode;
}) {
  if (!background.url) {
    return (
      <div className="space-y-6">
        {header}
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-xl" style={bgStyle(background)} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ backgroundColor: `rgba(0,0,0,${Math.min(80, Math.max(0, background.dim)) / 100})` }}
      />
      <div className="relative space-y-6 p-4 sm:p-6">
        {header ? <div className="rounded-lg bg-card/95 p-4 shadow-sm">{header}</div> : null}
        {children}
      </div>
    </div>
  );
}
