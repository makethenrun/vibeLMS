import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { getSectionsWithLessons } from "@/services/materials/sections-tree.service";
import { studentHasMaterialAccess } from "@/services/materials/student-access.service";
import { Workspace } from "@/app/(app)/materials/_components/workspace";
import { StudentSectionTree } from "../../_components/student-section-tree";

export const metadata: Metadata = { title: "Материал" };

export default async function StudentMaterialPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { studentId } = await requireStudent();
  const { materialId } = await params;

  const db = createServerSupabaseClient();
  if (!(await studentHasMaterialAccess(db, studentId, materialId))) notFound();

  const material = await getMaterial(db, materialId);
  if (!material) notFound();
  const sections = await getSectionsWithLessons(db, materialId);

  return (
    <div className="space-y-6">
      <PageHeader title={material.title} description={material.description ?? "Выберите урок в списке справа."} />
      <Workspace tree={<StudentSectionTree sections={sections} base="/learn" />} treeTitle="Разделы и уроки">
        <div className="space-y-4">
          {material.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.cover_url} alt="" className="aspect-square w-full max-w-[300px] rounded-2xl border object-cover" />
          ) : null}
          {material.description ? <p className="text-sm">{material.description}</p> : null}
          <EmptyState icon={BookOpen} title="Выберите урок" description="Откройте урок в списке разделов справа, чтобы начать." />
        </div>
      </Workspace>
    </div>
  );
}
