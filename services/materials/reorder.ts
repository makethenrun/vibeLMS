export function swapForMove<T extends { id: string; position: number }>(
  rows: T[],
  id: string,
  direction: "up" | "down",
): Array<{ id: string; position: number }> {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((r) => r.id === id);
  if (idx === -1) return [];
  const neighbourIdx = direction === "up" ? idx - 1 : idx + 1;
  if (neighbourIdx < 0 || neighbourIdx >= sorted.length) return [];
  const current = sorted[idx];
  const neighbour = sorted[neighbourIdx];
  return [
    { id: current.id, position: neighbour.position },
    { id: neighbour.id, position: current.position },
  ];
}
