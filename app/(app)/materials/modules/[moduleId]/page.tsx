import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { moduleCrumbs } from "@/services/materials/breadcrumbs.service";
import { listItems } from "@/services/materials/items.service";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { ItemList } from "./item-list";

export const metadata: Metadata = { title: "Модуль" };

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  await requireTutor();
  const { moduleId } = await params;

  const db = createServerSupabaseClient();
  const crumb = await moduleCrumbs(db, moduleId);
  if (!crumb) notFound();

  const items = await listItems(db, moduleId);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={crumb.crumbs} />
      <PageHeader title={crumb.title} description="Упражнения и обучающая информация модуля." />
      <ItemList moduleId={moduleId} items={items} />
    </div>
  );
}
