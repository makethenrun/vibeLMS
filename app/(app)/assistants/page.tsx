import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserCog } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireManager } from "@/lib/auth/guards";
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
  const user = await requireManager();
  const canManage = user.role === "TUTOR";
  const params = await searchParams;
  const archivedOnly = params.archived === "1";

  const db = createServerSupabaseClient();
  const [assistants, groups, materials] = await Promise.all([
    listAssistants(db, { archivedOnly }),
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
        description="Ассистенты и администраторы. Ассистенты видят выданные им группы и материалы; администраторы видят всё и управляют доступом."
        actions={canManage ? <AssistantDialog mode="create" trigger={addButton} /> : undefined}
      />

      <div className="flex items-center gap-2">
        <Button asChild variant={archivedOnly ? "outline" : "secondary"} size="sm">
          <Link href="/assistants">Активные</Link>
        </Button>
        <Button asChild variant={archivedOnly ? "secondary" : "outline"} size="sm">
          <Link href="/assistants?archived=1">Архив</Link>
        </Button>
      </div>

      {assistants.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={archivedOnly ? "В архиве пусто" : "Пока нет ассистентов"}
          description={archivedOnly ? "Архивированные ассистенты появятся здесь." : "Добавьте ассистента, чтобы делегировать проведение занятий и работу с материалами."}
          action={archivedOnly || !canManage ? undefined : <AssistantDialog mode="create" trigger={addButton} />}
        />
      ) : (
        <AssistantsTable assistants={assistants} groups={groupOptions} materials={materialOptions} canManage={canManage} />
      )}
    </div>
  );
}
