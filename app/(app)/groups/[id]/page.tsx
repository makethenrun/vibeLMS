import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getGroupWithMembers, listAddableStudents } from "@/services/groups/groups.service";
import { GroupDialog } from "../group-dialog";
import { GroupMembers } from "./group-members";

export const metadata: Metadata = { title: "Группа" };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTutor();
  const { id } = await params;

  const db = createServerSupabaseClient();
  const group = await getGroupWithMembers(db, id);
  if (!group) notFound();

  const addable = await listAddableStudents(db, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description="Состав группы"
        actions={
          <GroupDialog
            mode="edit"
            group={group}
            trigger={
              <Button variant="outline">
                <Pencil className="h-4 w-4" />
                Переименовать
              </Button>
            }
          />
        }
      />

      <GroupMembers groupId={group.id} members={group.members} addable={addable} />
    </div>
  );
}
