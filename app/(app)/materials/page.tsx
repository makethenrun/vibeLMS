import type { Metadata } from "next";
import { Library, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listMaterials } from "@/services/materials/materials.service";
import { MaterialCard } from "./material-card";
import { MaterialDialog } from "./material-dialog";

export const metadata: Metadata = { title: "Материалы" };

export default async function MaterialsPage() {
  const user = await requireUser();
  const isTutor = user.role === "TUTOR";

  const db = createServerSupabaseClient();
  const materials = await listMaterials(db);

  const addButton = (
    <Button>
      <Plus className="h-4 w-4" />
      Добавить материал
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Материалы"
        description="Общая библиотека учебных материалов."
        actions={isTutor ? <MaterialDialog trigger={addButton} /> : undefined}
      />

      {materials.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Пока нет материалов"
          description={
            isTutor
              ? "Загрузите PDF, изображения или добавьте ссылку на видео."
              : "Материалы появятся здесь, когда преподаватель их добавит."
          }
          action={isTutor ? <MaterialDialog trigger={addButton} /> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} isTutor={isTutor} />
          ))}
        </div>
      )}
    </div>
  );
}
