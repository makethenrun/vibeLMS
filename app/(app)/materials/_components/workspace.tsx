import type { ReactNode } from "react";

/**
 * Two-pane constructor layout: main content on the left, a contextual
 * navigation panel on the right (sticky on wide screens, stacked on mobile).
 */
export function Workspace({
  children,
  tree,
  treeTitle,
}: {
  children: ReactNode;
  tree: ReactNode;
  treeTitle: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{children}</div>
      <aside className="order-first h-fit rounded-lg border p-4 lg:order-last lg:sticky lg:top-4">
        <h2 className="mb-3 text-sm font-semibold">{treeTitle}</h2>
        {tree}
      </aside>
    </div>
  );
}
