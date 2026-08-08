"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Palette, Underline, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Field = HTMLInputElement | HTMLTextAreaElement;

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#6366f1", "#ec4899", "#111827"];

function isField(el: EventTarget | null): el is Field {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

/**
 * Floating helper that wraps the current selection in the focused text field
 * with inline formatting tags ([b]/[i]/[u]/[c=…]). The tags live inside the
 * stored plain text and are rendered by <FormattedText> wherever the text is
 * shown, so formatting persists and works in any exercise field.
 */
export function FormatBar() {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState(false);
  const lastEl = useRef<Field | null>(null);

  useEffect(() => {
    function onFocusIn(e: FocusEvent) {
      if (isField(e.target)) lastEl.current = e.target;
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  function wrap(openTag: string, closeTag: string) {
    const el = lastEl.current;
    if (!el || !el.isConnected) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const value = el.value;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + openTag + selected + closeTag + value.slice(end);

    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));

    el.focus();
    if (selected) {
      el.setSelectionRange(start + openTag.length, end + openTag.length);
    } else {
      const caret = start + openTag.length;
      el.setSelectionRange(caret, caret);
    }
  }

  const noBlur = (e: React.MouseEvent) => e.preventDefault();
  const iconBtn = "h-9 w-9";

  return (
    <div className="fixed bottom-4 right-[4.75rem] z-40 flex flex-col items-end gap-2">
      {open ? (
        <div className="flex items-center gap-1 rounded-full border bg-background p-1 shadow-lg">
          <Button size="icon" variant="ghost" className={iconBtn} title="Полужирный" onMouseDown={noBlur}
            onClick={() => wrap("[b]", "[/b]")}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className={iconBtn} title="Курсив" onMouseDown={noBlur}
            onClick={() => wrap("[i]", "[/i]")}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className={iconBtn} title="Подчёркивание" onMouseDown={noBlur}
            onClick={() => wrap("[u]", "[/u]")}>
            <Underline className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button size="icon" variant="ghost" className={iconBtn} title="Цвет текста" onMouseDown={noBlur}
              onClick={() => setColors((c) => !c)}>
              <Palette className="h-4 w-4" />
            </Button>
            {colors ? (
              <div className="absolute bottom-11 right-0 grid grid-cols-4 gap-1 rounded-md border bg-background p-1.5 shadow-lg">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Цвет ${c}`}
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: c }}
                    onMouseDown={noBlur}
                    onClick={() => {
                      wrap(`[c=${c}]`, "[/c]");
                      setColors(false);
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <Button
        size="icon"
        variant={open ? "default" : "outline"}
        className="h-11 w-11 rounded-full shadow-lg"
        onMouseDown={noBlur}
        onClick={() => setOpen((o) => !o)}
        aria-label="Оформление текста"
        title="Оформление: полужирный, курсив, подчёркивание, цвет"
      >
        {open ? <X className="h-5 w-5" /> : <Bold className="h-5 w-5" />}
      </Button>
    </div>
  );
}
