"use client";

import { Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { DictionaryEntry } from "@/types";
import { deleteEntryAction } from "./actions";
import { EntryDialog } from "./entry-dialog";

export function EntryRow({ entry }: { entry: DictionaryEntry }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{entry.term}</TableCell>
      <TableCell className="text-muted-foreground">{entry.pinyin ?? "—"}</TableCell>
      <TableCell>{entry.translation}</TableCell>
      <TableCell className="text-muted-foreground">{entry.note ?? "—"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <EntryDialog
            entry={entry}
            trigger={<Button size="icon" variant="ghost" aria-label="Редактировать"><Pencil className="h-4 w-4" /></Button>}
          />
          <ConfirmDialog
            trigger={<Button size="icon" variant="ghost" className="text-destructive" aria-label="Удалить"><Trash2 className="h-4 w-4" /></Button>}
            title="Удалить слово?"
            description={`«${entry.term}» будет удалено.`}
            confirmLabel="Удалить"
            variant="destructive"
            successMessage="Удалено"
            action={() => deleteEntryAction(entry.id)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
