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
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="rounded-md bg-muted p-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">
            <Link href={`/materials/${material.id}`} className="hover:underline">
              {material.title}
            </Link>
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Разделов: {material.sectionCount} · {formatDate(material.created_at)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/materials/${material.id}`}>Открыть</Link>
        </Button>
        <MaterialFormDialog
          material={material}
          trigger={
            <Button size="icon" variant="outline" aria-label="Редактировать">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <ConfirmDialog
          trigger={
            <Button size="icon" variant="outline" className="text-destructive" aria-label="Удалить">
              <Trash2 className="h-4 w-4" />
            </Button>
          }
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
