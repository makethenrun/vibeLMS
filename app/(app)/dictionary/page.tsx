import type { Metadata } from "next";
import { BookA, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listDictionary } from "@/services/dictionary/dictionary.service";
import { EntryDialog } from "./entry-dialog";
import { EntryRow } from "./entry-row";

export const metadata: Metadata = { title: "Словарь" };

export default async function DictionaryPage() {
  const user = await requireUser();

  const db = createServerSupabaseClient();
  const entries = await listDictionary(db, user.id);

  const addButton = (
    <Button>
      <Plus className="h-4 w-4" />
      Добавить слово
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Словарь"
        description="Ваш личный словарь слов и переводов."
        actions={<EntryDialog trigger={addButton} />}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={BookA}
          title="Словарь пуст"
          description="Добавьте первое слово."
          action={<EntryDialog trigger={addButton} />}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Слово</TableHead>
              <TableHead>Пиньинь</TableHead>
              <TableHead>Перевод</TableHead>
              <TableHead>Заметка</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
