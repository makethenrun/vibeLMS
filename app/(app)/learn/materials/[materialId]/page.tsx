import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { getMaterial } from "@/services/materials/materials.service";
import { getSectionsWithLessons } from "@/services/materials/sections-tree.service";
import { studentHasMaterialAccess } from "@/services/materials/student-access.service";

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
      <PageHeader title={material.title} description={material.description ?? "Разделы и уроки материала."} />

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">В материале пока нет разделов.</p>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <h2 className="text-sm font-semibold">{section.title}</h2>
              {section.lessons.length === 0 ? (
                <p className="pl-4 text-sm text-muted-foreground">Нет уроков.</p>
              ) : (
                <ul className="space-y-1">
                  {section.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/learn/lessons/${lesson.id}`}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
