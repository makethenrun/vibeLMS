import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { assistantMaterialAccess, canAccessGroup } from "@/services/assistants/assistants.service";
import { getGroupWithMembers, listAddableStudents } from "@/services/groups/groups.service";
import { listGroupMaterials, listMaterialsAddableToGroup } from "@/services/materials/material-groups.service";
import { getSectionsWithLessons } from "@/services/materials/sections-tree.service";
import { getGroupLessonAccess } from "@/services/materials/lesson-access.service";
import type { LessonAccessMode } from "@/types";
import { GroupDialog } from "../group-dialog";
import { GroupMembers } from "./group-members";
import { AddMaterialToGroup } from "./add-material";
import { GroupMaterialList, type AccessRule, type MaterialNode } from "./group-material-list";

export const metadata: Metadata = { title: "Группа" };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const isTutor = user.role === "TUTOR";
  const canManage = isTutor || user.role === "ADMINISTRATOR";
  const { id } = await params;

  const db = createServerSupabaseClient();
  if (!(await canAccessGroup(db, user, id))) notFound();
  const group = await getGroupWithMembers(db, id);
  if (!group) notFound();

  const addable = canManage ? await listAddableStudents(db, id) : [];
  const addableMaterials = canManage ? await listMaterialsAddableToGroup(db, id) : [];
  let materials = await listGroupMaterials(db, id);
  if (!isTutor) {
    const access = await assistantMaterialAccess(db, user.id);
    materials = materials.filter((m) => access.has(m.id));
  }

  // Build the material → sections → lessons tree and this group's access rules.
  const accessRows = await getGroupLessonAccess(db, id);
  const accessRecord: Record<string, AccessRule> = {};
  for (const [lessonId, r] of accessRows) {
    accessRecord[lessonId] = { mode: r.mode as LessonAccessMode, availableAt: r.available_at, unlocked: r.unlocked };
  }
  const materialNodes: MaterialNode[] = await Promise.all(
    materials.map(async (m): Promise<MaterialNode> => {
      const sections = await getSectionsWithLessons(db, m.id);
      return {
        id: m.id,
        title: m.title,
        coverUrl: m.cover_url ?? null,
        sections: sections.map((s) => ({
          id: s.id,
          title: s.title,
          isHomework: s.is_homework,
          lessons: s.lessons.map((l) => ({ id: l.id, title: l.title, isHomework: s.is_homework })),
        })),
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description="Состав группы"
        actions={
          isTutor ? (
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
          ) : null
        }
      />

      {canManage ? (
        <GroupMembers groupId={group.id} members={group.members} addable={addable} />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Участники ({group.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {group.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">В группе нет учеников.</p>
            ) : (
              <ul className="divide-y text-sm">
                {group.members.map((m) => (
                  <li key={m.id} className="py-2">
                    <Link href={`/students/${m.id}`} className="hover:underline">{m.full_name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Доступные материалы ({materials.length})</CardTitle>
          {canManage ? <AddMaterialToGroup groupId={group.id} materials={addableMaterials.map((m) => ({ id: m.id, title: m.title }))} /> : null}
        </CardHeader>
        <CardContent>
          <GroupMaterialList
            materials={materialNodes}
            groupId={group.id}
            canManage={canManage}
            access={accessRecord}
          />
        </CardContent>
      </Card>
    </div>
  );
}
