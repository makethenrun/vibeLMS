import type { Metadata } from "next";
import { Layers, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listMaterials } from "@/services/materials/materials.service";
import { MaterialCard } from "./material-card";
import { MaterialFormDialog } from "./material-form-dialog";

export const metadata: Metadata = { title: "Материалы" };

export default async function MaterialsPage() {
  await requireTutor();

  const db = createServerSupabaseClient();
  const materials = await listMaterials(db);

  const addButton = (
    <Button>
      <Plus className="h-4 w-4" />
      Создать материал
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Материалы"
        description="Конструктор учебных материалов."
        actions={<MaterialFormDialog trigger={addButton} />}
      />

      {materials.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Пока нет материалов"
          description="Создайте материал и наполните его разделами, уроками и упражнениями."
          action={<MaterialFormDialog trigger={addButton} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}
