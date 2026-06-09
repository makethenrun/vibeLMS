"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

interface FileUploadProps {
  folder: "materials" | "submissions";
  accept?: string;
  value?: string | null;
  onUploaded: (url: string | null) => void;
}

interface UploadResponse {
  url?: string;
  error?: string;
}

export function FileUpload({ folder, accept, value, onUploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Файл слишком большой (максимум 25 МБ)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/storage/upload", { method: "POST", body: formData });
      const data = (await response.json()) as UploadResponse;
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Не удалось загрузить файл");
      }

      setFileName(file.name);
      onUploaded(data.url);
      toast.success("Файл загружен");
    } catch (error) {
      onUploaded(null);
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {value ? "Заменить файл" : "Выбрать файл"}
        </Button>
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Paperclip className="h-3.5 w-3.5" />
            {fileName ?? "Загруженный файл"}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">Файл не выбран</span>
        )}
      </div>
    </div>
  );
}
