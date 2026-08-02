import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { getSectionsWithLessons } from "@/services/materials/sections-tree.service";
import { listMaterialGroupIds } from "@/services/materials/material-groups.service";
import { listGroups } from "@/services/groups/groups.service";
import { Breadcrumbs } from "../_components/breadcrumbs";
import { Workspace } from "../_components/workspace";
import { MaterialFormDialog } from "../material-form-dialog";
import { GroupsAccess } from "./groups-access";
import { MaterialCover } from "./material-cover";
import { SectionTree } from "./section-tree";

export const metadata: Metadata = { title: "Материал" };

export default async function MaterialOverviewPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  await requireTutor();
  const { materialId } = await params;

  const db = createServerSupabaseClient();
  const material = await getMaterial(db, materialId);
  if (!material) notFound();

  const [sections, groups, selectedGroupIds] = await Promise.all([
    getSectionsWithLessons(db, materialId),
    listGroups(db),
    listMaterialGroupIds(db, materialId),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Материалы", href: "/materials" },
          { label: material.title, href: `/materials/${material.id}` },
        ]}
      />
      <PageHeader
        title={material.title}
        description="Обложка, описание и структура материала."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/materials/${material.id}/results`}>
                <BarChart3 className="h-4 w-4" />
                Результаты
              </Link>
            </Button>
            <MaterialFormDialog
              material={material}
              trigger={
                <Button variant="outline">
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </Button>
              }
            />
          </>
        }
      />
      <Workspace tree={<SectionTree materialId={material.id} sections={sections} />} treeTitle="Разделы">
        <div className="space-y-6">
          <MaterialCover material={material} />
          <GroupsAccess materialId={material.id} groups={groups} selectedIds={selectedGroupIds} />
        </div>
      </Workspace>
    </div>
  );
}
