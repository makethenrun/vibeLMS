"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { Json } from "@/types";
import { submitItemAction } from "../actions";

export function useSubmit(itemId: string, initialScore: number | null | undefined) {
  const [score, setScore] = useState<number | null | undefined>(initialScore);
  const [saving, setSaving] = useState(false);

  async function submit(answer: Json): Promise<void> {
    setSaving(true);
    try {
      const result = await submitItemAction(itemId, answer);
      if (result.success) {
        setScore(result.data.score);
        toast.success("Ответ отправлен");
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return { score, saving, submit, locked: score !== undefined };
}
