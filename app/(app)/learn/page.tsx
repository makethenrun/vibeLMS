import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Layers } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listStudentMaterials } from "@/services/materials/student-access.service";

export const metadata: Metadata = { title: "Обучение" };

export default async function LearnPage() {
  const { studentId } = await requireStudent();
  const db = createServerSupabaseClient();
  const materials = await listStudentMaterials(db, studentId);

  return (
    <div className="space-y-6">
      <PageHeader title="Обучение" description="Доступные вам материалы." />

      {materials.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Пока нет материалов"
          description="Материалы появятся, когда преподаватель откроет их вашей группе."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="rounded-md bg-muted p-2">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">{m.title}</CardTitle>
                  {m.description ? <p className="mt-1 text-xs text-muted-foreground">{m.description}</p> : null}
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/learn/materials/${m.id}`}>Открыть</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
