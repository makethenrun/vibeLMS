import type { ReactNode } from "react";

/**
 * Paints an optional lesson background behind its children (the module menu and
 * exercise blocks). `dim` (0..80) darkens the image to keep content readable.
 * With no background it renders children unchanged.
 */
export function LessonSurface({
  backgroundUrl,
  dim,
  children,
}: {
  backgroundUrl: string | null;
  dim: number;
  children: ReactNode;
}) {
  if (!backgroundUrl) return <>{children}</>;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${backgroundUrl}")` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ backgroundColor: `rgba(0,0,0,${Math.min(80, Math.max(0, dim)) / 100})` }}
      />
      <div className="relative p-4 sm:p-6">{children}</div>
    </div>
  );
}
