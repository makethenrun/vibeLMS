"use client";

import { useState } from "react";
import { SquareAsterisk, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { insertAtCaret } from "./pinyin-bar";

// Curated IPA set (English-focused, plus common general symbols and marks).
const GROUPS: { title: string; symbols: string[] }[] = [
  { title: "Гласные", symbols: ["i", "ɪ", "e", "ɛ", "æ", "ə", "ɜ", "ʌ", "ɑ", "ɒ", "ɔ", "o", "ʊ", "u", "ɐ", "ɘ", "ɤ", "ɯ", "y", "ø", "œ", "ɶ"] },
  { title: "Дифтонги", symbols: ["eɪ", "aɪ", "ɔɪ", "aʊ", "oʊ", "əʊ", "ɪə", "eə", "ʊə"] },
  { title: "Согласные", symbols: ["ʃ", "ʒ", "θ", "ð", "ŋ", "tʃ", "dʒ", "ʔ", "ɹ", "ɾ", "r", "ɫ", "ç", "x", "ɣ", "ʁ", "ɲ", "ʎ", "ɸ", "β", "ʝ", "ɡ", "ʍ", "w", "j"] },
  { title: "Ударение и долгота", symbols: ["ˈ", "ˌ", "ː", "ˑ", "̃", "̥", "̩"] },
];

/** Floating IPA symbol palette; inserts into the focused text field. */
export function IpaBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-[9.5rem] z-40 flex flex-col items-end gap-2" onMouseDown={(e) => e.preventDefault()}>
      {open ? (
        <div className="absolute bottom-12 right-0 max-h-[60vh] w-72 space-y-2 overflow-y-auto rounded-lg border bg-background p-2 shadow-lg">
          {GROUPS.map((g) => (
            <div key={g.title} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{g.title}</p>
              <div className="flex flex-wrap gap-1">
                {g.symbols.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => insertAtCaret(s)}
                    className="h-8 min-w-8 rounded-md border bg-background px-2 text-base hover:bg-accent"
                    title={`Вставить ${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <Button
        size="icon"
        variant={open ? "default" : "outline"}
        className="h-11 w-11 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
        aria-label="IPA"
        title="Раскладка IPA (транскрипция)"
      >
        {open ? <X className="h-5 w-5" /> : <SquareAsterisk className="h-5 w-5" />}
      </Button>
    </div>
  );
}
