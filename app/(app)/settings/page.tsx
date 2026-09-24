import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { requireManager } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import type { SettingsInput } from "@/lib/validators";
import { getSettings } from "@/services/settings/settings.service";
import { SettingsForm } from "./settings-form";
import { AllChats } from "./all-chats";
import { LatencyHistory } from "@/components/dev/latency-history";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const user = await requireManager();
  const isTutor = user.role === "TUTOR";

  const db = createServerSupabaseClient();
  const settings = await getSettings(db);

  const defaults: SettingsInput = {
    organizationName: settings.organization_name,
    logoUrl: settings.logo_url ?? "",
    enabledKeyboards: Array.isArray(settings.enabled_keyboards) ? (settings.enabled_keyboards as string[]) : [],
    languages: Array.isArray(settings.languages) ? (settings.languages as string[]) : [],
    assistantsCanCreateMaterials: Boolean(settings.assistants_can_create_materials),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Настройки"
        description="Название и логотип отображаются в навигации системы."
      />
      {isTutor ? <SettingsForm defaults={defaults} /> : null}
      <AllChats />

      <section className="space-y-2">
        <div>
          <h2 className="text-base font-semibold">Диагностика откликов (временно)</h2>
          <p className="text-xs text-muted-foreground">
            История времени отклика на нажатия и того, куда нажимали. Скопируйте или скачайте JSON и пришлите для анализа.
          </p>
        </div>
        <LatencyHistory />
      </section>
    </div>
  );
}
