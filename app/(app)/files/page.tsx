import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listFiles } from "@/services/files/files.service";
import { FileCard } from "./file-card";
import { FileDialog } from "./file-dialog";

export const metadata: Metadata = { title: "Файлы" };

export default async function FilesPage() {
  const user = await requireUser();
  const isTutor = user.role === "TUTOR";

  const db = createServerSupabaseClient();
  const files = await listFiles(db);

  const addButton = (
    <Button>
      <Plus className="h-4 w-4" />
      Добавить файл
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Файлы"
        description="Библиотека файлов для вложений в домашние задания."
        actions={isTutor ? <FileDialog trigger={addButton} /> : undefined}
      />

      {files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Пока нет файлов"
          description={
            isTutor
              ? "Загрузите PDF, изображения или добавьте ссылку на видео."
              : "Файлы появятся здесь, когда преподаватель их добавит."
          }
          action={isTutor ? <FileDialog trigger={addButton} /> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <FileCard key={file.id} file={file} isTutor={isTutor} />
          ))}
        </div>
      )}
    </div>
  );
}
