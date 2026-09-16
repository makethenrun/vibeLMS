import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { GrammarInput } from "@/lib/validators";
import type { GrammarEntry } from "@/types";

export async function listGrammar(db: Db): Promise<GrammarEntry[]> {
  const { data, error } = await db
    .from("grammar_entries")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createGrammar(db: Db, input: GrammarInput): Promise<GrammarEntry> {
  const { data: last } = await db
    .from("grammar_entries")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { data, error } = await db
    .from("grammar_entries")
    .insert({ title: input.title, body: input.body, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateGrammar(db: Db, id: string, input: GrammarInput): Promise<void> {
  const { error } = await db
    .from("grammar_entries")
    .update({ title: input.title, body: input.body, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteGrammar(db: Db, id: string): Promise<void> {
  const { error } = await db.from("grammar_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
