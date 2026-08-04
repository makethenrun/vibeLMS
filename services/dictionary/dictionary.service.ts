import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { DictionaryEntryInput } from "@/lib/validators";
import type { DictionaryEntry } from "@/types";

function nullable(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

export async function listDictionary(db: Db): Promise<DictionaryEntry[]> {
  const { data, error } = await db.from("dictionary_entries").select("*").order("term", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEntry(db: Db, input: DictionaryEntryInput): Promise<DictionaryEntry> {
  const { data, error } = await db
    .from("dictionary_entries")
    .insert({ term: input.term, translation: input.translation, pinyin: nullable(input.pinyin), note: nullable(input.note) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEntry(db: Db, id: string, input: DictionaryEntryInput): Promise<void> {
  const { error } = await db
    .from("dictionary_entries")
    .update({ term: input.term, translation: input.translation, pinyin: nullable(input.pinyin), note: nullable(input.note) })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteEntry(db: Db, id: string): Promise<void> {
  const { error } = await db.from("dictionary_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
