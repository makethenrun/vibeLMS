"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setLessonBackgroundAction } from "../actions";

interface UploadResponse {
  url?: string;
  error?: string;
}

export function LessonBackgroundDialog({
  lessonId,
  backgroundUrl,
  dim,
}: {
  lessonId: string;
  backgroundUrl: string | null;
  dim: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(backgroundUrl);
  const [dimValue, setDimValue] = useState(dim);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(nextUrl: string | null, nextDim: number) {
    setSaving(true);
    const result = await setLessonBackgroundAction(lessonId, { url: nextUrl, dim: nextDim });
    setSaving(false);
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "backgrounds");
      const response = await fetch("/api/storage/upload", { method: "POST", body: formData });
      const data = (await response.json()) as UploadResponse;
      if (!response.ok || !data.url) throw new Error(data.error ?? "Не удалось загрузить файл");
      setUrl(data.url);
      await save(data.url, dimValue);
      toast.success("Фон обновлён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    setUrl(null);
    setDimValue(0);
    await save(null, 0);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ImageIcon className="h-4 w-4" />
          Фон урока
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Фон урока</DialogTitle>
          <DialogDescription>
            Отображается позади меню разделов и блоков с упражнениями — у ученика тоже.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${dimValue / 100})` }} />
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Фон не задан</span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Снижение яркости: {dimValue}%</label>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={dimValue}
              disabled={!url}
              onChange={(e) => setDimValue(Number(e.target.value))}
              onPointerUp={() => url && void save(url, dimValue)}
              onKeyUp={() => url && void save(url, dimValue)}
              className="w-full accent-primary disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex">
              <Button asChild variant="default" disabled={uploading || saving}>
                <span>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Загрузить изображение
                </span>
              </Button>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            {url ? (
              <Button variant="outline" className="text-destructive" onClick={() => void remove()} disabled={saving}>
                <Trash2 className="h-4 w-4" />
                Убрать фон
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
