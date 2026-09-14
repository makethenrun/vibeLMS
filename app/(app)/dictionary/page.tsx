import type { Metadata } from "next";
import { BookA, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listDictionary } from "@/services/dictionary/dictionary.service";
import { getSettings } from "@/services/settings/settings.service";
import { DictionaryTable } from "./dictionary-table";
import { EntryDialog } from "./entry-dialog";

export const metadata: Metadata = { title: "Словарь" };

export default async function DictionaryPage() {
  const user = await requireUser();

  const db = createServerSupabaseClient();
  const [entries, settings] = await Promise.all([listDictionary(db, user.id), getSettings(db)]);
  const enabledKeyboards = Array.isArray(settings.enabled_keyboards) ? (settings.enabled_keyboards as string[]) : [];

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
        actions={<EntryDialog trigger={addButton} enabledKeyboards={enabledKeyboards} />}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={BookA}
          title="Словарь пуст"
          description="Добавьте первое слово."
          action={<EntryDialog trigger={addButton} enabledKeyboards={enabledKeyboards} />}
        />
      ) : (
        <DictionaryTable entries={entries} enabledKeyboards={enabledKeyboards} />
      )}
    </div>
  );
}
