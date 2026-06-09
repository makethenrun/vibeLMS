import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listStudents } from "@/services/students/students.service";
import { StudentDialog } from "./student-dialog";
import { StudentsTable } from "./students-table";

export const metadata: Metadata = { title: "Ученики" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  await requireTutor();
  const params = await searchParams;
  const includeArchived = params.archived === "1";

  const db = createServerSupabaseClient();
  const students = await listStudents(db, { includeArchived });

  const addButton = (
    <Button>
      <Plus className="h-4 w-4" />
      Добавить ученика
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ученики"
        description="Управление учениками и доступом в систему."
        actions={<StudentDialog mode="create" trigger={addButton} />}
      />

      <div className="flex items-center gap-2">
        <Button asChild variant={includeArchived ? "outline" : "secondary"} size="sm">
          <Link href="/students">Активные</Link>
        </Button>
        <Button asChild variant={includeArchived ? "secondary" : "outline"} size="sm">
          <Link href="/students?archived=1">Все (с архивом)</Link>
        </Button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Пока нет учеников"
          description="Добавьте первого ученика, чтобы начать вести расписание и задания."
          action={<StudentDialog mode="create" trigger={addButton} />}
        />
      ) : (
        <StudentsTable students={students} />
      )}
    </div>
  );
}
