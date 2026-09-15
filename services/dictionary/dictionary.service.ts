import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { DictionaryEntryInput } from "@/lib/validators";
import type { DictionaryEntry } from "@/types";

function nullable(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

export async function listDictionary(db: Db, ownerId: string): Promise<DictionaryEntry[]> {
  const { data, error } = await db
    .from("dictionary_entries")
    .select("*")
    .eq("owner_id", ownerId)
    .order("term", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEntry(db: Db, ownerId: string, input: DictionaryEntryInput): Promise<DictionaryEntry> {
  const { data, error } = await db
    .from("dictionary_entries")
    .insert({ owner_id: ownerId, term: input.term, translation: input.translation, pinyin: nullable(input.pinyin), note: nullable(input.note) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Adds an exercise's "new words" to a student's dictionary, skipping words whose
 * term is already there (case-insensitive). Best-effort bulk insert; returns how
 * many were added.
 */
export async function importVocabToDictionary(
  db: Db,
  ownerId: string,
  vocab: { term?: string; pinyin?: string; translation?: string }[],
): Promise<number> {
  const words = vocab
    .map((v) => ({ term: (v.term ?? "").trim(), pinyin: (v.pinyin ?? "").trim(), translation: (v.translation ?? "").trim() }))
    .filter((v) => v.term);
  if (words.length === 0) return 0;

  const { data: existing } = await db.from("dictionary_entries").select("term").eq("owner_id", ownerId);
  const seen = new Set((existing ?? []).map((e) => (e.term ?? "").trim().toLowerCase()));

  const rows: { owner_id: string; term: string; translation: string; pinyin: string | null; note: null }[] = [];
  for (const w of words) {
    const key = w.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ owner_id: ownerId, term: w.term, translation: w.translation, pinyin: w.pinyin || null, note: null });
  }
  if (rows.length === 0) return 0;
  const { error } = await db.from("dictionary_entries").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function updateEntry(db: Db, ownerId: string, id: string, input: DictionaryEntryInput): Promise<void> {
  const { error } = await db
    .from("dictionary_entries")
    .update({ term: input.term, translation: input.translation, pinyin: nullable(input.pinyin), note: nullable(input.note) })
    .eq("id", id)
    .eq("owner_id", ownerId);
  if (error) throw new Error(error.message);
}

export async function deleteEntry(db: Db, ownerId: string, id: string): Promise<void> {
  const { error } = await db.from("dictionary_entries").delete().eq("id", id).eq("owner_id", ownerId);
  if (error) throw new Error(error.message);
}
