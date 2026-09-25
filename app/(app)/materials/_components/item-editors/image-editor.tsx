"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { imageEntries, itemContentSchema, type ImageContent, type ItemContent } from "@/lib/validators";
import { DrawableImage } from "../drawable-image";

interface Label {
  text: string;
  x: number;
  y: number;
  opacity: number;
  size: number;
}

interface ImageDraft {
  url: string;
  caption: string;
  annotations: string | null;
  labels: Label[];
}

interface EditorProps {
  content: ImageContent;
  onSave: (content: ItemContent) => Promise<void>;
}

const MAX_IMAGES = 20;

/** Editor for a single image: URL/upload, drawing, caption and draggable labels. */
function ImageEntryEditor({
  entry,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  entry: ImageDraft;
  index: number;
  count: number;
  onChange: (next: ImageDraft) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);

  const setLabels = (labels: Label[]) => onChange({ ...entry, labels });

  function startDrag(i: number, e: ReactPointerEvent) {
    dragIdx.current = i;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDrag(e: ReactPointerEvent) {
    const i = dragIdx.current;
    const box = boxRef.current;
    if (i === null || !box) return;
    const r = box.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    setLabels(entry.labels.map((l, j) => (j === i ? { ...l, x, y } : l)));
  }
  function endDrag() {
    dragIdx.current = null;
  }

  function clearOverlays() {
    onChange({ ...entry, annotations: null, labels: [] });
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Изображение {index + 1}</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Вверх">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Вниз">
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onRemove} aria-label="Удалить изображение">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {entry.url ? (
        <DrawableImage url={entry.url} value={entry.annotations} onChange={(a) => onChange({ ...entry, annotations: a })} />
      ) : (
        <p className="text-sm text-muted-foreground">Изображение не задано.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Ссылка на изображение" value={entry.url} onChange={(e) => onChange({ ...entry, url: e.target.value, annotations: null, labels: [] })} />
        <FileUpload
          folder="materials"
          accept=".jpg,.jpeg,.png,.webp"
          value={entry.url || null}
          onUploaded={(u) => onChange({ ...entry, url: u ?? "", annotations: null, labels: [] })}
        />
      </div>
      <Input placeholder="Подпись (необязательно)" value={entry.caption} onChange={(e) => onChange({ ...entry, caption: e.target.value })} />

      {entry.url ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Надписи на изображении</p>
            <div className="flex items-center gap-1">
              {(entry.annotations || entry.labels.length > 0) ? (
                <Button type="button" size="sm" variant="ghost" onClick={clearOverlays}>Очистить</Button>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={() => setLabels([...entry.labels, { text: "Надпись", x: 40, y: 45, opacity: 100, size: 16 }])}>
                <Plus className="h-4 w-4" />
                Надпись
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Перетаскивайте надписи по картинке. Белый фон, прозрачность настраивается.</p>

          <div ref={boxRef} className="relative inline-block max-w-full select-none" onPointerMove={onDrag} onPointerUp={endDrag} onPointerLeave={endDrag}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.url} alt="" className="block max-h-80 rounded-lg border" draggable={false} />
            {entry.labels.map((l, i) => (
              <span
                key={i}
                onPointerDown={(e) => startDrag(i, e)}
                style={{ left: `${l.x}%`, top: `${l.y}%`, backgroundColor: `rgba(255,255,255,${l.opacity / 100})`, fontSize: `${l.size}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap rounded px-1.5 py-0.5 font-semibold leading-tight text-black shadow-sm"
              >
                {l.text || "…"}
              </span>
            ))}
          </div>

          {entry.labels.length > 0 ? (
            <div className="space-y-1">
              {entry.labels.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="h-8 flex-1"
                    placeholder="Текст надписи"
                    value={l.text}
                    onChange={(e) => setLabels(entry.labels.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title="Размер шрифта">
                    <input
                      type="range" min={10} max={96} step={1} value={l.size}
                      onChange={(e) => setLabels(entry.labels.map((x, j) => (j === i ? { ...x, size: Number(e.target.value) } : x)))}
                      className="w-20"
                    />
                    <span className="w-8 text-right tabular-nums">{l.size}px</span>
                  </label>
                  <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title="Прозрачность белого фона">
                    <input
                      type="range" min={0} max={100} step={5} value={l.opacity}
                      onChange={(e) => setLabels(entry.labels.map((x, j) => (j === i ? { ...x, opacity: Number(e.target.value) } : x)))}
                      className="w-20"
                    />
                    <span className="w-8 text-right tabular-nums">{l.opacity}%</span>
                  </label>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Удалить надпись"
                    onClick={() => setLabels(entry.labels.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ImageEditor({ content, onSave }: EditorProps) {
  const [images, setImages] = useState<ImageDraft[]>(
    imageEntries(content).map((e) => ({ url: e.url, caption: e.caption ?? "", annotations: e.annotations ?? null, labels: (e.labels ?? []).map((l) => ({ ...l, opacity: l.opacity ?? 100, size: l.size ?? 16 })) })),
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function patch(index: number, next: ImageDraft) {
    setImages((prev) => prev.map((img, i) => (i === index ? next : img)));
  }
  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const arr = [...prev];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[index], arr[j]] = [arr[j], arr[index]];
      return arr;
    });
  }

  async function uploadOne(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "materials");
    const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      toast.error(data.error ?? "Ошибка загрузки");
      return null;
    }
    return data.url;
  }

  async function handleFiles(files: FileList) {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Не более ${MAX_IMAGES} изображений`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    const added: ImageDraft[] = [];
    try {
      for (const file of selected) {
        const url = await uploadOne(file);
        if (url) added.push({ url, caption: "", annotations: null, labels: [] });
      }
      if (added.length) setImages((prev) => [...prev, ...added]);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const entries = images
      .filter((i) => i.url.trim() !== "")
      .map((i) => ({ url: i.url, caption: i.caption.trim() || null, annotations: i.annotations, labels: i.labels.filter((l) => l.text.trim()) }));
    const first = entries[0];
    const parsed = itemContentSchema.safeParse({
      type: "IMAGE",
      // Legacy single-image fields mirror the first image for old readers.
      url: first?.url ?? "",
      caption: first?.caption ?? null,
      annotations: first?.annotations ?? null,
      labels: first?.labels ?? [],
      images: entries,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте изображение");
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">Изображения не добавлены.</p>
      ) : (
        images.map((img, index) => (
          <ImageEntryEditor
            key={index}
            entry={img}
            index={index}
            count={images.length}
            onChange={(next) => patch(index, next)}
            onRemove={() => setImages((prev) => prev.filter((_, i) => i !== index))}
            onMove={(dir) => move(index, dir)}
          />
        ))
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) void handleFiles(files);
            e.target.value = "";
          }}
        />
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading || images.length >= MAX_IMAGES}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Добавить изображения (можно несколько)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, { url: "", caption: "", annotations: null, labels: [] }]))} disabled={images.length >= MAX_IMAGES}>
          <Plus className="h-4 w-4" />
          По ссылке
        </Button>
      </div>

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
