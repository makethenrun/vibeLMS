import type { ReactNode } from "react";

/**
 * Two-pane constructor layout: main content on the left, the material
 * navigation tree on the right (sticky on wide screens, stacked on mobile).
 */
export function Workspace({ children, tree }: { children: ReactNode; tree: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{children}</div>
      <aside className="order-first h-fit rounded-lg border p-4 lg:order-last lg:sticky lg:top-4">
        <h2 className="mb-3 text-sm font-semibold">Содержание материала</h2>
        {tree}
      </aside>
    </div>
  );
}
