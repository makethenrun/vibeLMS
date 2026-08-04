"use client";

import Link from "next/link";
import { Layers, Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { MaterialWithCounts } from "@/types";
import { deleteMaterialAction } from "./actions";
import { MaterialFormDialog } from "./material-form-dialog";

export function MaterialCard({ material }: { material: MaterialWithCounts }) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/materials/${material.id}`} className="block">
        {material.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.cover_url} alt="" className="aspect-[3/4] w-full object-cover" />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted">
            <Layers className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </Link>
      <CardHeader className="py-3">
        <CardTitle className="truncate text-base">
          <Link href={`/materials/${material.id}`} className="hover:underline">{material.title}</Link>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Разделов: {material.sectionCount} · {formatDate(material.created_at)}</p>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/materials/${material.id}`}>Открыть</Link>
        </Button>
        <MaterialFormDialog
          material={material}
          trigger={<Button size="icon" variant="outline" aria-label="Редактировать"><Pencil className="h-4 w-4" /></Button>}
        />
        <ConfirmDialog
          trigger={<Button size="icon" variant="outline" className="text-destructive" aria-label="Удалить"><Trash2 className="h-4 w-4" /></Button>}
          title="Удалить материал?"
          description={`«${material.title}» и всё его содержимое будут удалены без возможности восстановления.`}
          confirmLabel="Удалить"
          variant="destructive"
          successMessage="Материал удалён"
          action={deleteMaterialAction.bind(null, material.id)}
        />
      </CardContent>
    </Card>
  );
}
