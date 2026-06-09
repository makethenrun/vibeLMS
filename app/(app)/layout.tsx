import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getSettings } from "@/services/settings/settings.service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = createServerSupabaseClient();
  const settings = await getSettings(db);

  return (
    <AppShell
      role={user.role}
      login={user.login}
      orgName={settings.organization_name}
      logoUrl={settings.logo_url}
    >
      {children}
    </AppShell>
  );
}
