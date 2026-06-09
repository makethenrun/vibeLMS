"use client";

import { ExternalLink, FileText, ImageIcon, Trash2, Video } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";
import type { MaterialType } from "@/lib/db/database.types";
import { formatDate } from "@/lib/utils";
import type { Material } from "@/types";
import { deleteMaterialAction } from "./actions";

function iconFor(type: MaterialType) {
  if (type === "VIDEO_LINK") return Video;
  if (type === "JPG" || type === "PNG" || type === "WEBP") return ImageIcon;
  return FileText;
}

export function MaterialCard({ material, isTutor }: { material: Material; isTutor: boolean }) {
  const Icon = iconFor(material.material_type);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="rounded-md bg-muted p-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{material.title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {MATERIAL_TYPE_LABELS[material.material_type]} · {formatDate(material.created_at)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <a href={material.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            {material.material_type === "VIDEO_LINK" ? "Открыть" : "Скачать"}
          </a>
        </Button>
        {isTutor ? (
          <ConfirmDialog
            trigger={
              <Button size="icon" variant="outline" className="text-destructive" aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Удалить материал?"
            description={`«${material.title}» будет удалён без возможности восстановления.`}
            confirmLabel="Удалить"
            variant="destructive"
            successMessage="Материал удалён"
            action={deleteMaterialAction.bind(null, material.id)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
