import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { sectionCrumbs } from "@/services/materials/breadcrumbs.service";
import { listLessons } from "@/services/materials/lessons.service";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { LessonList } from "./lesson-list";

export const metadata: Metadata = { title: "Раздел" };

export default async function SectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  await requireTutor();
  const { sectionId } = await params;

  const db = createServerSupabaseClient();
  const crumb = await sectionCrumbs(db, sectionId);
  if (!crumb) notFound();

  const lessons = await listLessons(db, sectionId);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={crumb.crumbs} />
      <PageHeader title={crumb.title} description="Уроки раздела." />
      <LessonList sectionId={sectionId} lessons={lessons} />
    </div>
  );
}
