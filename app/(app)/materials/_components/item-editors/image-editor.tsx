"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { itemContentSchema, type ImageContent, type ItemContent } from "@/lib/validators";
import { DrawableImage } from "../drawable-image";

interface EditorProps {
  content: ImageContent;
  onSave: (content: ItemContent) => Promise<void>;
}

interface Label {
  text: string;
  x: number;
  y: number;
  opacity: number;
}

export function ImageEditor({ content, onSave }: EditorProps) {
  const [url, setUrl] = useState(content.url);
  const [caption, setCaption] = useState(content.caption ?? "");
  const [annotations, setAnnotations] = useState<string | null>(content.annotations ?? null);
  const [labels, setLabels] = useState<Label[]>((content.labels ?? []).map((l) => ({ ...l, opacity: l.opacity ?? 100 })));
  const [saving, setSaving] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);

  function clearOverlays() {
    setAnnotations(null);
    setLabels([]);
  }

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
    setLabels((prev) => prev.map((l, j) => (j === i ? { ...l, x, y } : l)));
  }
  function endDrag() {
    dragIdx.current = null;
  }

  async function handleSave() {
    const cleanLabels = labels.filter((l) => l.text.trim());
    const parsed = itemContentSchema.safeParse({ type: "IMAGE", url, caption: caption.trim() || null, annotations, labels: cleanLabels });
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
      {url ? (
        <DrawableImage url={url} value={annotations} onChange={setAnnotations} />
      ) : (
        <p className="text-sm text-muted-foreground">Изображение не задано.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Ссылка на изображение" value={url} onChange={(e) => { setUrl(e.target.value); clearOverlays(); }} />
        <FileUpload
          folder="materials"
          accept=".jpg,.jpeg,.png,.webp"
          value={url || null}
          onUploaded={(u) => { setUrl(u ?? ""); clearOverlays(); }}
        />
      </div>
      <Input placeholder="Подпись (необязательно)" value={caption} onChange={(e) => setCaption(e.target.value)} />

      {url ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Надписи на изображении</p>
            <Button type="button" size="sm" variant="outline" onClick={() => setLabels((prev) => [...prev, { text: "Надпись", x: 40, y: 45, opacity: 100 }])}>
              <Plus className="h-4 w-4" />
              Надпись
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Перетаскивайте надписи по картинке. Белый фон, прозрачность настраивается.</p>

          <div ref={boxRef} className="relative inline-block max-w-full select-none" onPointerMove={onDrag} onPointerUp={endDrag} onPointerLeave={endDrag}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="block max-h-80 rounded-lg border" draggable={false} />
            {labels.map((l, i) => (
              <span
                key={i}
                onPointerDown={(e) => startDrag(i, e)}
                style={{ left: `${l.x}%`, top: `${l.y}%`, backgroundColor: `rgba(255,255,255,${l.opacity / 100})` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap rounded px-1.5 py-0.5 text-sm font-semibold text-black shadow-sm"
              >
                {l.text || "…"}
              </span>
            ))}
          </div>

          {labels.length > 0 ? (
            <div className="space-y-1">
              {labels.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="h-8 flex-1"
                    placeholder="Текст надписи"
                    value={l.text}
                    onChange={(e) => setLabels((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title="Прозрачность белого фона">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={l.opacity}
                      onChange={(e) => setLabels((prev) => prev.map((x, j) => (j === i ? { ...x, opacity: Number(e.target.value) } : x)))}
                      className="w-24"
                    />
                    <span className="w-8 text-right tabular-nums">{l.opacity}%</span>
                  </label>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Удалить надпись"
                    onClick={() => setLabels((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
