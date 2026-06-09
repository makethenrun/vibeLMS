import type { Metadata } from "next";
import { Plus, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listGroups } from "@/services/groups/groups.service";
import { GroupCard } from "./group-card";
import { GroupDialog } from "./group-dialog";

export const metadata: Metadata = { title: "Группы" };

export default async function GroupsPage() {
  await requireTutor();

  const db = createServerSupabaseClient();
  const groups = await listGroups(db);

  const addButton = (
    <Button>
      <Plus className="h-4 w-4" />
      Создать группу
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Группы"
        description="Объединяйте учеников в группы для занятий и заданий."
        actions={<GroupDialog mode="create" trigger={addButton} />}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Пока нет групп"
          description="Создайте группу и добавьте в неё учеников."
          action={<GroupDialog mode="create" trigger={addButton} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
