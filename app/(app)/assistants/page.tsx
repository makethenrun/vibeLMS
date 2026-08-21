import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listAssistants } from "@/services/assistants/assistants.service";
import { listGroups } from "@/services/groups/groups.service";
import { listMaterials } from "@/services/materials/materials.service";
import { AssistantsManager } from "./assistants-manager";

export const metadata: Metadata = { title: "Ассистенты" };

export default async function AssistantsPage() {
  await requireTutor();
  const db = createServerSupabaseClient();

  const [assistants, groups, materials] = await Promise.all([
    listAssistants(db),
    listGroups(db),
    listMaterials(db),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ассистенты"
        description="Преподаватели-ассистенты с ограниченными правами: видят только выданные им группы и материалы, проводят занятия, редактируют материал только с разрешения."
      />
      <AssistantsManager
        assistants={assistants}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        materials={materials.map((m) => ({ id: m.id, title: m.title }))}
      />
    </div>
  );
}
