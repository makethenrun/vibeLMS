"use client";

import { useContext, useState } from "react";
import { toast } from "sonner";

import type { ItemContent } from "@/lib/validators";
import type { Json } from "@/types";
import { playAnswerSound } from "@/lib/audio/answer-sound";
import { SubmitContext } from "./submit-context";

export function useSubmit(itemId: string, initialScore: number | null | undefined) {
  const submitFn = useContext(SubmitContext);
  const [score, setScore] = useState<number | null | undefined>(initialScore);
  const [saving, setSaving] = useState(false);

  async function submit(answer: Json, content: ItemContent): Promise<void> {
    setSaving(true);
    try {
      const result = await submitFn(itemId, answer, content);
      setScore(result);
      // Short feedback sound (full score = correct chime; partial/zero = buzz).
      if (typeof result === "number") playAnswerSound(result);
      toast.success("Задание выполнено");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return { score, saving, submit, locked: score !== undefined };
}
