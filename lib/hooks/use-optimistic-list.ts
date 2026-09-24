"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/utils/action-result";

/**
 * Mirrors a server-provided list so edits show instantly. `mutate` applies the
 * new list optimistically, runs the server action in the background, refreshes
 * on success (to reconcile ids/positions), and rolls back on failure.
 */
export function useOptimisticList<T>(serverItems: T[]) {
  const router = useRouter();
  const [items, setItems] = useState<T[]>(serverItems);
  const [busy, setBusy] = useState(false);

  // Adopt the authoritative server state whenever it changes (after a refresh).
  useEffect(() => setItems(serverItems), [serverItems]);

  async function mutate(next: T[], action: () => Promise<ActionResult>): Promise<boolean> {
    const snapshot = items;
    setItems(next);
    setBusy(true);
    try {
      const result = await action();
      if (result.success) {
        router.refresh();
        return true;
      }
      setItems(snapshot);
      toast.error(result.error);
      return false;
    } catch {
      setItems(snapshot);
      toast.error("Не удалось сохранить");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { items, setItems, busy, mutate };
}

/** Swap two array elements, returning a new array. */
export function swapItems<T>(arr: T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}
