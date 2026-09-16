import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { getStudentOrNull, requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listDictionary, listOwnerLanguages } from "@/services/dictionary/dictionary.service";
import { getSettings } from "@/services/settings/settings.service";
import { listStudentMaterials } from "@/services/materials/student-access.service";
import { DictionaryTabs } from "./dictionary-tabs";

export const metadata: Metadata = { title: "Словарь" };

export default async function DictionaryPage() {
  const user = await requireUser();

  const db = createServerSupabaseClient();
  const [entries, settings] = await Promise.all([listDictionary(db, user.id), getSettings(db)]);
  const enabledKeyboards = Array.isArray(settings.enabled_keyboards) ? (settings.enabled_keyboards as string[]) : [];
  const settingsLanguages = Array.isArray(settings.languages) ? (settings.languages as string[]) : [];

  // Which dictionaries this user has (one per language).
  let languages: string[];
  if (user.role !== "STUDENT") {
    languages = settingsLanguages;
  } else {
    // Student: languages of accessible materials + languages already used —
    // so a dictionary is kept even after material access ends.
    const student = await getStudentOrNull();
    const langs = new Set<string>();
    if (student) {
      const materials = await listStudentMaterials(db, student.studentId);
      for (const m of materials) if (m.language) langs.add(m.language);
    }
    for (const l of await listOwnerLanguages(db, user.id)) langs.add(l);
    languages = [...langs];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Словари"
        description="По одному словарю на язык изучения."
      />
      <DictionaryTabs entries={entries} languages={languages} enabledKeyboards={enabledKeyboards} />
    </div>
  );
}
