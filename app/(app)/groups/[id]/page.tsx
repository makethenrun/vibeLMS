import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers, Pencil, Radio } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { assistantMaterialAccess, canAccessGroup } from "@/services/assistants/assistants.service";
import { getGroupWithMembers, listAddableStudents } from "@/services/groups/groups.service";
import { listGroupMaterials } from "@/services/materials/material-groups.service";
import { GroupDialog } from "../group-dialog";
import { GroupMembers } from "./group-members";

export const metadata: Metadata = { title: "Группа" };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const isTutor = user.role === "TUTOR";
  const { id } = await params;

  const db = createServerSupabaseClient();
  if (!(await canAccessGroup(db, user, id))) notFound();
  const group = await getGroupWithMembers(db, id);
  if (!group) notFound();

  const addable = isTutor ? await listAddableStudents(db, id) : [];
  let materials = await listGroupMaterials(db, id);
  if (!isTutor) {
    const access = await assistantMaterialAccess(db, user.id);
    materials = materials.filter((m) => access.has(m.id));
  }

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

      {isTutor ? (
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
                  <li key={m.id} className="py-2">{m.full_name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Доступные материалы ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Группе пока не открыт доступ ни к одному материалу. Откройте доступ на странице материала.
            </p>
          ) : (
            <ul className="divide-y">
              {materials.map((material) => (
                <li key={material.id} className="flex items-center gap-3 py-2">
                  <Link
                    href={`/materials/${material.id}`}
                    className="flex flex-1 items-center gap-3 hover:text-primary"
                  >
                    {material.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={material.cover_url} alt="" className="h-12 w-9 rounded object-cover" />
                    ) : (
                      <div className="flex h-12 w-9 items-center justify-center rounded bg-muted">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{material.title}</span>
                  </Link>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/materials/${material.id}/session/${group.id}`}>
                      <Radio className="h-4 w-4" />
                      Провести занятие
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
