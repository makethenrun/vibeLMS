import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { listSections } from "@/services/materials/sections.service";
import { Breadcrumbs } from "../_components/breadcrumbs";
import { MaterialFormDialog } from "../material-form-dialog";
import { SectionList } from "./section-list";

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

  const sections = await listSections(db, materialId);

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
        description={material.description ?? "Разделы материала."}
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
      <SectionList materialId={material.id} sections={sections} />
    </div>
  );
}
