"use client";

import { useState } from "react";
import { ChevronLeft, Keyboard, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EXTRA_KEYBOARDS } from "@/lib/keyboards";
import { insertAtCaret } from "./pinyin-bar";

/**
 * Floating "extra keyboard" helper. The button opens a picker of the keyboards
 * enabled in Settings; choosing one shows its symbol palette, which inserts
 * into the focused text field. Renders nothing when none are enabled.
 */
export function ExtraKeyboards({ enabled }: { enabled: string[] }) {
  const keyboards = EXTRA_KEYBOARDS.filter((k) => enabled.includes(k.id));
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (keyboards.length === 0) return null;

  const active = keyboards.find((k) => k.id === activeId) ?? null;

  return (
    <div className="fixed bottom-4 right-[9.5rem] z-40 flex flex-col items-end gap-2" onMouseDown={(e) => e.preventDefault()}>
      {open ? (
        <div className="absolute bottom-12 right-0 max-h-[60vh] w-72 overflow-y-auto rounded-lg border bg-background p-2 shadow-lg">
          {active ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Клавиатуры
              </button>
              {active.groups.map((g) => (
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
          ) : (
            <div className="space-y-1">
              <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Выберите клавиатуру</p>
              {keyboards.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setActiveId(k.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <Keyboard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {k.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
      <Button
        size="icon"
        variant={open ? "default" : "outline"}
        className="h-11 w-11 rounded-full shadow-lg"
        onClick={() => { setOpen((o) => !o); setActiveId(null); }}
        aria-label="Дополнительная клавиатура"
        title="Дополнительная клавиатура"
      >
        {open ? <X className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
      </Button>
    </div>
  );
}
