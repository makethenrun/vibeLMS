import type { Metadata } from "next";
import { Layers, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { assistantMaterialAccess } from "@/services/assistants/assistants.service";
import { listMaterials } from "@/services/materials/materials.service";
import { MaterialsBrowser } from "./materials-browser";
import { MaterialFormDialog } from "./material-form-dialog";

export const metadata: Metadata = { title: "Материалы" };

export default async function MaterialsPage() {
  const user = await requireStaff();
  const isTutor = user.role === "TUTOR";

  const db = createServerSupabaseClient();
  let materials = await listMaterials(db);
  if (!isTutor) {
    const access = await assistantMaterialAccess(db, user.id);
    materials = materials.filter((m) => access.has(m.id));
  }

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
        description={isTutor ? "Конструктор учебных материалов." : "Материалы, выданные вам главным преподавателем."}
        actions={isTutor ? <MaterialFormDialog trigger={addButton} /> : null}
      />

      {materials.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Пока нет материалов"
          description={isTutor ? "Создайте материал и наполните его разделами, уроками и упражнениями." : "Главный преподаватель ещё не выдал вам материалы."}
          action={isTutor ? <MaterialFormDialog trigger={addButton} /> : undefined}
        />
      ) : (
        <MaterialsBrowser materials={materials} />
      )}
    </div>
  );
}
