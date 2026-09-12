import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getSettings } from "@/services/settings/settings.service";
import { getLiveIndicator } from "@/services/materials/live-session.service";
import { AddToDictionary } from "./dictionary/add-to-dictionary";
import { PinyinBar } from "@/components/editor/pinyin-bar";
import { IpaBar } from "@/components/editor/ipa-bar";
import { FormatBar } from "@/components/editor/format-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = createServerSupabaseClient();
  const [settings, liveIndicator] = await Promise.all([
    getSettings(db),
    getLiveIndicator(db, { role: user.role, id: user.id }),
  ]);

  return (
    <AppShell
      role={user.role}
      login={user.login}
      orgName={settings.organization_name}
      logoUrl={settings.logo_url}
      liveIndicator={liveIndicator}
    >
      {children}
      <AddToDictionary />
      <PinyinBar />
      <FormatBar />
      <IpaBar />
    </AppShell>
  );
}
