import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import type { SettingsInput } from "@/lib/validators";
import { getSettings } from "@/services/settings/settings.service";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  await requireTutor();

  const db = createServerSupabaseClient();
  const settings = await getSettings(db);

  const defaults: SettingsInput = {
    organizationName: settings.organization_name,
    logoUrl: settings.logo_url ?? "",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Настройки"
        description="Название и логотип отображаются в навигации системы."
      />
      <SettingsForm defaults={defaults} />
    </div>
  );
}
