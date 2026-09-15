"use client";

import { useState } from "react";
import { BookPlus, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { importItemVocabAction } from "../actions";

/** Adds the exercise's "new words" to the student's dictionary on demand. */
export function ImportVocabButton({ itemId }: { itemId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    setBusy(true);
    const result = await importItemVocabAction(itemId);
    setBusy(false);
    if (result.success) {
      setDone(true);
      toast.success(result.data.count > 0 ? `Добавлено слов в словарь: ${result.data.count}` : "Все слова уже в словаре");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={run} disabled={busy}>
      {done ? <Check className="h-4 w-4" /> : <BookPlus className="h-4 w-4" />}
      {done ? "Слова добавлены" : "Добавить слова в словарь"}
    </Button>
  );
}
