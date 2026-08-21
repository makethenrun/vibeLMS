import type { Metadata } from "next";
import { Plus, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { assistantGroupIds } from "@/services/assistants/assistants.service";
import { listGroups } from "@/services/groups/groups.service";
import { GroupCard } from "./group-card";
import { GroupDialog } from "./group-dialog";

export const metadata: Metadata = { title: "Группы" };

export default async function GroupsPage() {
  const user = await requireStaff();
  const isTutor = user.role === "TUTOR";

  const db = createServerSupabaseClient();
  let groups = await listGroups(db);
  if (!isTutor) {
    const ids = new Set(await assistantGroupIds(db, user.id));
    groups = groups.filter((g) => ids.has(g.id));
  }

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
        description={isTutor ? "Объединяйте учеников в группы для занятий и заданий." : "Группы, выданные вам главным преподавателем."}
        actions={isTutor ? <GroupDialog mode="create" trigger={addButton} /> : null}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Пока нет групп"
          description={isTutor ? "Создайте группу и добавьте в неё учеников." : "Главный преподаватель ещё не выдал вам группы."}
          action={isTutor ? <GroupDialog mode="create" trigger={addButton} /> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} readOnly={!isTutor} />
          ))}
        </div>
      )}
    </div>
  );
}
