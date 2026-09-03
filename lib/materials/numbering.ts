/**
 * Automatic "module.exercise" numbering within a lesson.
 *
 * Modules are numbered 1, 2, 3 … by their order in the lesson. Inside a module,
 * items are numbered 1, 2, 3 … in order, but any item flagged `unnumbered` is
 * skipped — its number simply passes to the next item. The visible label is
 * `${moduleNumber}.${exerciseNumber}` (e.g. "2.3").
 */

/** Map of item id → exercise number within its module (unnumbered items omitted). */
export function numberItems(items: { id: string; unnumbered?: boolean | null }[]): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  for (const it of items) {
    if (it.unnumbered) continue;
    map.set(it.id, ++n);
  }
  return map;
}

/** Full "M.E" label for one item, or null when it carries no number. */
export function itemLabel(moduleNumber: number, exerciseNumber: number | undefined): string | null {
  return exerciseNumber ? `${moduleNumber}.${exerciseNumber}` : null;
}
