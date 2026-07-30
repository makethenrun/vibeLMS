"use client";

import { ExternalLink, FileText, ImageIcon, Trash2, Video } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";
import type { MaterialType } from "@/lib/db/database.types";
import { formatDate } from "@/lib/utils";
import type { FileRecord } from "@/types";
import { deleteFileAction } from "./actions";

function iconFor(type: MaterialType) {
  if (type === "VIDEO_LINK") return Video;
  if (type === "JPG" || type === "PNG" || type === "WEBP") return ImageIcon;
  return FileText;
}

export function FileCard({ file, isTutor }: { file: FileRecord; isTutor: boolean }) {
  const Icon = iconFor(file.material_type);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="rounded-md bg-muted p-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{file.title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {MATERIAL_TYPE_LABELS[file.material_type]} · {formatDate(file.created_at)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <a href={file.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            {file.material_type === "VIDEO_LINK" ? "Открыть" : "Скачать"}
          </a>
        </Button>
        {isTutor ? (
          <ConfirmDialog
            trigger={
              <Button size="icon" variant="outline" className="text-destructive" aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Удалить файл?"
            description={`«${file.title}» будет удалён без возможности восстановления.`}
            confirmLabel="Удалить"
            variant="destructive"
            successMessage="Файл удалён"
            action={deleteFileAction.bind(null, file.id)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
