import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { SettingsInput } from "@/lib/validators";
import type { Settings } from "@/types";

const DEFAULT_SETTINGS: Settings = {
  id: "",
  organization_name: "pLMS",
  logo_url: null,
  created_at: new Date(0).toISOString(),
};

export async function getSettings(db: Db): Promise<Settings> {
  const { data } = await db
    .from("settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? DEFAULT_SETTINGS;
}

export async function updateSettings(db: Db, input: SettingsInput): Promise<Settings> {
  const existing = await getSettings(db);
  const payload = {
    organization_name: input.organizationName,
    logo_url: input.logoUrl && input.logoUrl.trim() !== "" ? input.logoUrl.trim() : null,
  };

  if (existing.id) {
    const { data, error } = await db
      .from("settings")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await db.from("settings").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}
