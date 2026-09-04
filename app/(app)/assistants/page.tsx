import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserCog } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listAssistants } from "@/services/assistants/assistants.service";
import { listGroups } from "@/services/groups/groups.service";
import { listMaterials } from "@/services/materials/materials.service";
import { AssistantDialog } from "./assistant-dialog";
import { AssistantsTable } from "./assistants-table";

export const metadata: Metadata = { title: "Ассистенты" };

export default async function AssistantsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  await requireTutor();
  const params = await searchParams;
  const includeArchived = params.archived === "1";

  const db = createServerSupabaseClient();
  const [assistants, groups, materials] = await Promise.all([
    listAssistants(db, { includeArchived }),
    listGroups(db),
    listMaterials(db),
  ]);

  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));
  const materialOptions = materials.map((m) => ({ id: m.id, title: m.title }));

  const addButton = (
    <Button>
      <Plus className="h-4 w-4" />
      Добавить ассистента
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ассистенты"
        description="Преподаватели-ассистенты с ограниченными правами: видят только выданные им группы и материалы, проводят занятия, редактируют материал только с разрешения."
        actions={<AssistantDialog mode="create" trigger={addButton} />}
      />

      <div className="flex items-center gap-2">
        <Button asChild variant={includeArchived ? "outline" : "secondary"} size="sm">
          <Link href="/assistants">Активные</Link>
        </Button>
        <Button asChild variant={includeArchived ? "secondary" : "outline"} size="sm">
          <Link href="/assistants?archived=1">Все (с архивом)</Link>
        </Button>
      </div>

      {assistants.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Пока нет ассистентов"
          description="Добавьте ассистента, чтобы делегировать проведение занятий и работу с материалами."
          action={<AssistantDialog mode="create" trigger={addButton} />}
        />
      ) : (
        <AssistantsTable assistants={assistants} groups={groupOptions} materials={materialOptions} />
      )}
    </div>
  );
}
