"use client";

import { useState } from "react";
import { Languages, X } from "lucide-react";

import { Button } from "@/components/ui/button";

// ü and the four combining tone marks (attach to the preceding vowel).
const KEYS: { label: string; char: string }[] = [
  { label: "ü", char: "ü" },
  { label: "◌̄", char: "̄" },
  { label: "◌́", char: "́" },
  { label: "◌̌", char: "̌" },
  { label: "◌̀", char: "̀" },
];

function insertAtCaret(text: string) {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(el, el.value.slice(0, start) + text + el.value.slice(end));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const caret = start + text.length;
    el.setSelectionRange(caret, caret);
  } else if (el.isContentEditable) {
    document.execCommand("insertText", false, text);
  }
}

/** Floating pinyin helper available in any text field (both roles). */
export function PinyinBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2" onMouseDown={(e) => e.preventDefault()}>
      {open ? (
        <div className="flex items-center gap-1 rounded-full border bg-background p-1 shadow-lg">
          {KEYS.map((k) => (
            <Button
              key={k.label}
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-base"
              title={k.label === "ü" ? "ü" : "Тоновый знак"}
              onClick={() => insertAtCaret(k.char)}
            >
              {k.label}
            </Button>
          ))}
        </div>
      ) : null}
      <Button
        size="icon"
        variant={open ? "default" : "outline"}
        className="h-11 w-11 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
        aria-label="Пиньинь"
        title="Пиньинь: ü и тоновые знаки"
      >
        {open ? <X className="h-5 w-5" /> : <Languages className="h-5 w-5" />}
      </Button>
    </div>
  );
}
