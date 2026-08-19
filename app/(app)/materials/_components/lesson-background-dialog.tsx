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

type Fit = "cover" | "contain" | "tile";
type Position = "top" | "center" | "bottom";

interface UploadResponse {
  url?: string;
  error?: string;
}

export function LessonBackgroundDialog({
  lessonId,
  backgroundUrl,
  dim,
  fit,
  position,
  scale,
}: {
  lessonId: string;
  backgroundUrl: string | null;
  dim: number;
  fit: Fit;
  position: Position;
  scale: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(backgroundUrl);
  const [dimValue, setDimValue] = useState(dim);
  const [fitValue, setFitValue] = useState<Fit>(fit);
  const [posValue, setPosValue] = useState<Position>(position);
  const [scaleValue, setScaleValue] = useState(scale);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(next?: Partial<{ url: string | null; dim: number; fit: Fit; position: Position; scale: number }>) {
    const payload = {
      url: next?.url !== undefined ? next.url : url,
      dim: next?.dim ?? dimValue,
      fit: next?.fit ?? fitValue,
      position: next?.position ?? posValue,
      scale: next?.scale ?? scaleValue,
    };
    setSaving(true);
    const result = await setLessonBackgroundAction(lessonId, payload);
    setSaving(false);
    if (result.success) router.refresh();
    else toast.error(result.error);
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
      await save({ url: data.url });
      toast.success("Фон обновлён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    setUrl(null);
    await save({ url: null });
  }

  const previewStyle =
    fitValue === "tile"
      ? { backgroundImage: `url("${url}")`, backgroundRepeat: "repeat" as const, backgroundSize: `${scaleValue}%`, backgroundPosition: `center ${posValue}` }
      : { backgroundImage: `url("${url}")`, backgroundRepeat: "no-repeat" as const, backgroundSize: fitValue, backgroundPosition: `center ${posValue}` };

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
          <div className="relative h-40 overflow-hidden rounded-lg border bg-muted">
            {url ? (
              <>
                <div className="absolute inset-0" style={previewStyle} />
                <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${dimValue / 100})` }} />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Фон не задан</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Вписывание</label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={fitValue}
                disabled={!url}
                onChange={(e) => { const v = e.target.value as Fit; setFitValue(v); void save({ fit: v }); }}
              >
                <option value="cover">Заполнить (обрезать)</option>
                <option value="contain">Целиком (без обрезки)</option>
                <option value="tile">Плитка (повтор)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Положение</label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={posValue}
                disabled={!url}
                onChange={(e) => { const v = e.target.value as Position; setPosValue(v); void save({ position: v }); }}
              >
                <option value="top">Сверху</option>
                <option value="center">По центру</option>
                <option value="bottom">Снизу</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Масштаб (для плитки): {scaleValue}%</label>
            <input
              type="range"
              min={25}
              max={300}
              step={5}
              value={scaleValue}
              disabled={!url || fitValue !== "tile"}
              onChange={(e) => setScaleValue(Number(e.target.value))}
              onPointerUp={() => url && void save({ scale: scaleValue })}
              onKeyUp={() => url && void save({ scale: scaleValue })}
              className="w-full accent-primary disabled:opacity-50"
            />
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
              onPointerUp={() => url && void save({ dim: dimValue })}
              onKeyUp={() => url && void save({ dim: dimValue })}
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
