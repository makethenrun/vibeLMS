"use client";

import { useState } from "react";
import { BookA, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DictionaryEntry } from "@/types";
import { listDictionaryAction } from "@/app/(app)/dictionary/actions";

export function DictionaryFab() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DictionaryEntry[] | null>(null);
  const [q, setQ] = useState("");

  async function toggle() {
    if (!open && entries === null) setEntries(await listDictionaryAction());
    setOpen((o) => !o);
  }

  const needle = q.trim().toLowerCase();
  const filtered = (entries ?? []).filter(
    (e) =>
      !needle ||
      e.term.toLowerCase().includes(needle) ||
      e.translation.toLowerCase().includes(needle) ||
      (e.pinyin ?? "").toLowerCase().includes(needle),
  );

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex justify-center">
        <Button
          type="button"
          size="icon"
          variant={open ? "default" : "outline"}
          className="h-11 w-11 rounded-full"
          onClick={toggle}
          aria-label="Словарь"
          title="Словарь"
        >
          {open ? <X className="h-5 w-5" /> : <BookA className="h-5 w-5" />}
        </Button>
      </div>

      {open ? (
        <div className="mt-3 space-y-2 rounded-lg border p-3">
          <p className="text-sm font-semibold">Словарь</p>
          <Input className="h-8" placeholder="Поиск…" value={q} onChange={(e) => setQ(e.target.value)} />
          {entries === null ? (
            <p className="text-xs text-muted-foreground">Загрузка…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ничего не найдено.</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-auto text-sm">
              {filtered.map((e) => (
                <li key={e.id} className="rounded px-1 py-0.5">
                  <span className="font-medium">{e.term}</span>
                  {e.pinyin ? <span className="text-muted-foreground"> · {e.pinyin}</span> : null}
                  <span className="text-muted-foreground"> — {e.translation}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
