"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

interface MultiFileUploadProps {
  folder: "materials" | "submissions";
  accept?: string;
  /** Current list of file URLs (controlled). */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Maximum number of files allowed. */
  max?: number;
}

interface UploadResponse {
  url?: string;
  error?: string;
}

/** Derives a short, human-friendly label from a stored file URL. */
function fileLabel(url: string, names: Record<string, string>, index: number): string {
  if (names[url]) return names[url];
  return `Файл ${index + 1}`;
}

export function MultiFileUpload({
  folder,
  accept,
  value,
  onChange,
  max = 5,
}: MultiFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Remembers original file names for files uploaded during this session.
  const [names, setNames] = useState<Record<string, string>>({});

  const atMax = value.length >= max;

  async function uploadOne(file: File): Promise<string | null> {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`«${file.name}» слишком большой (максимум 25 МБ)`);
      return null;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/storage/upload", { method: "POST", body: formData });
    const data = (await response.json()) as UploadResponse;
    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "Не удалось загрузить файл");
    }
    setNames((previous) => ({ ...previous, [data.url as string]: file.name }));
    return data.url;
  }

  async function handleFiles(files: FileList) {
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Можно прикрепить не более ${max} файлов`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Добавлены только первые ${remaining} файл(ов) — лимит ${max}`);
    }

    setUploading(true);
    const next = [...value];
    try {
      for (const file of selected) {
        const url = await uploadOne(file);
        if (url && !next.includes(url)) next.push(url);
      }
      onChange(next);
    } catch (error) {
      onChange(next);
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((item) => item !== url));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.target.files;
          if (files && files.length > 0) void handleFiles(files);
          event.target.value = "";
        }}
      />

      {value.length > 0 ? (
        <ul className="space-y-1.5">
          {value.map((url, index) => (
            <li
              key={url}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-sm"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-1.5 text-primary hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{fileLabel(url, names, index)}</span>
              </a>
              <button
                type="button"
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                onClick={() => remove(url)}
                aria-label="Убрать файл"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || atMax}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Добавить файлы
        </Button>
        <span className="text-xs text-muted-foreground">
          {atMax ? `Достигнут лимит (${max})` : `${value.length} из ${max}`}
        </span>
      </div>
    </div>
  );
}
