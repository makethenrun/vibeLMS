"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * A "paste a column" helper: the tutor types/pastes values one per line (Enter)
 * and applies them to the rows in order. Non-destructive — `onApply` receives
 * the non-empty lines and decides how to distribute them (extending rows as
 * needed without touching other fields such as uploaded images).
 */
export function BulkFill({
  label,
  placeholder,
  onApply,
}: {
  label: string;
  placeholder?: string;
  onApply: (lines: string[]) => void;
}) {
  const [text, setText] = useState("");

  function apply() {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    onApply(lines);
    setText("");
  }

  return (
    <details className="rounded-md border border-dashed p-2">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">{label}</summary>
      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="mt-2" />
      <Button type="button" size="sm" variant="outline" className="mt-2" onClick={apply}>
        Заполнить
      </Button>
    </details>
  );
}
