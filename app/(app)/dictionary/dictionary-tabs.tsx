"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DictionaryEntry } from "@/types";
import { DictionaryTable } from "./dictionary-table";
import { EntryDialog } from "./entry-dialog";

/**
 * One dictionary per study language, shown as tabs. Languages come from the
 * server (staff: all settings languages; student: their materials' languages
 * plus any language they already have words in). Legacy words with no language
 * live in the "Общий" tab.
 */
export function DictionaryTabs({
  entries,
  languages,
  enabledKeyboards,
}: {
  entries: DictionaryEntry[];
  languages: string[];
  enabledKeyboards: string[];
}) {
  const hasNull = entries.some((e) => !e.language);
  const tabs: (string | null)[] = [...languages];
  if (hasNull || tabs.length === 0) tabs.push(null);

  const [active, setActive] = useState<string | null>(tabs[0] ?? null);
  const current = tabs.some((t) => t === active) ? active : (tabs[0] ?? null);
  const list = entries.filter((e) => (e.language ?? null) === current);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t ?? "__null"}
            type="button"
            onClick={() => setActive(t)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              current === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
            )}
          >
            {t ?? "Общий"}
          </button>
        ))}
        <div className="ml-auto">
          <EntryDialog
            key={current ?? "__null"}
            language={current}
            enabledKeyboards={enabledKeyboards}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Добавить слово
              </Button>
            }
          />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          В словаре «{current ?? "Общий"}» пока нет слов.
        </p>
      ) : (
        <DictionaryTable entries={list} enabledKeyboards={enabledKeyboards} />
      )}
    </div>
  );
}
