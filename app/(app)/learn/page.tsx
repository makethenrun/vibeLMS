import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Layers, Radio } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listStudentMaterials } from "@/services/materials/student-access.service";
import { getActiveSessionForStudent } from "@/services/materials/live-session.service";

export const metadata: Metadata = { title: "Обучение" };

export default async function LearnPage() {
  const { studentId } = await requireStudent();
  const db = createServerSupabaseClient();
  const [materials, liveSession] = await Promise.all([
    listStudentMaterials(db, studentId),
    getActiveSessionForStudent(db, studentId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Обучение" description="Доступные вам материалы." />

      {liveSession ? (
        <Link
          href="/learn/live"
          className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 hover:bg-red-100"
        >
          <Radio className="h-5 w-5 animate-pulse text-red-500" />
          <span className="font-medium">Идёт занятие — присоединиться</span>
        </Link>
      ) : null}

      {materials.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Пока нет материалов"
          description="Материалы появятся, когда преподаватель откроет их вашей группе."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <Link href={`/learn/materials/${m.id}`} className="block">
                {m.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.cover_url} alt="" className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted">
                    <Layers className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </Link>
              <CardHeader className="py-3">
                <CardTitle className="truncate text-base">{m.title}</CardTitle>
                {m.description ? <p className="mt-1 text-xs text-muted-foreground">{m.description}</p> : null}
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
