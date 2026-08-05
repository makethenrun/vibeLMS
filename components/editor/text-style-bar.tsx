"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Type, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Editable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

const FONTS: { label: string; value: string }[] = [
  { label: "Шрифт", value: "" },
  { label: "С засечками", value: "Georgia, 'Times New Roman', serif" },
  { label: "Моноширинный", value: "'Courier New', monospace" },
  { label: "Рукописный 楷体", value: "'Kaiti SC', 'KaiTi', STKaiti, serif" },
];

const SIZES: { label: string; value: string }[] = [
  { label: "Размер", value: "" },
  ...[14, 16, 18, 20, 24, 28, 32].map((n) => ({ label: `${n}px`, value: `${n}px` })),
];

function isEditable(el: EventTarget | null): el is Editable {
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * Floating helper that applies inline text styling (font, size, bold, italic)
 * to whatever text field the user last focused. Works with plain
 * inputs/textareas and contenteditable (rich-text) editors alike.
 */
export function TextStyleBar() {
  const [open, setOpen] = useState(false);
  const lastEl = useRef<Editable | null>(null);

  useEffect(() => {
    function onFocusIn(e: FocusEvent) {
      if (isEditable(e.target)) lastEl.current = e.target;
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  function apply(mutate: (el: Editable) => void) {
    const el = lastEl.current;
    if (!el || !el.isConnected) return;
    mutate(el);
  }

  function toggleBold() {
    apply((el) => {
      const bold = el.style.fontWeight === "bold" || el.style.fontWeight === "700";
      el.style.fontWeight = bold ? "normal" : "bold";
    });
  }

  function toggleItalic() {
    apply((el) => {
      el.style.fontStyle = el.style.fontStyle === "italic" ? "normal" : "italic";
    });
  }

  const noBlur = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="fixed bottom-4 right-[4.75rem] z-40 flex flex-col items-end gap-2">
      {open ? (
        <div className="flex items-center gap-1 rounded-full border bg-background p-1 shadow-lg">
          <Button size="icon" variant="ghost" className="h-9 w-9" title="Жирный" onMouseDown={noBlur} onClick={toggleBold}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9" title="Курсив" onMouseDown={noBlur} onClick={toggleItalic}>
            <Italic className="h-4 w-4" />
          </Button>
          <select
            className="h-9 rounded-md border bg-background px-1 text-sm"
            title="Шрифт"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              apply((el) => (el.style.fontFamily = v));
            }}
          >
            {FONTS.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-1 text-sm"
            title="Размер шрифта"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              apply((el) => (el.style.fontSize = v));
            }}
          >
            {SIZES.map((s) => (
              <option key={s.label} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      ) : null}
      <Button
        size="icon"
        variant={open ? "default" : "outline"}
        className="h-11 w-11 rounded-full shadow-lg"
        onMouseDown={noBlur}
        onClick={() => setOpen((o) => !o)}
        aria-label="Параметры текста"
        title="Параметры текста: шрифт, размер, жирный, курсив"
      >
        {open ? <X className="h-5 w-5" /> : <Type className="h-5 w-5" />}
      </Button>
    </div>
  );
}
