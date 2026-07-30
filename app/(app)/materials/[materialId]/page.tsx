import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Layers, Pencil } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { getMaterialTree } from "@/services/materials/material-tree.service";
import { Breadcrumbs } from "../_components/breadcrumbs";
import { MaterialTree } from "../_components/material-tree";
import { Workspace } from "../_components/workspace";
import { MaterialFormDialog } from "../material-form-dialog";

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

  const tree = await getMaterialTree(db, materialId);

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
        description={material.description ?? "Структура материала."}
        actions={
          <MaterialFormDialog
            material={material}
            trigger={
              <Button variant="outline">
                <Pencil className="h-4 w-4" />
                Редактировать
              </Button>
            }
          />
        }
      />
      <Workspace tree={<MaterialTree materialId={material.id} tree={tree} />}>
        <EmptyState
          icon={Layers}
          title="Выберите урок"
          description="Выберите урок в дереве справа или создайте новый раздел и урок."
        />
      </Workspace>
    </div>
  );
}
