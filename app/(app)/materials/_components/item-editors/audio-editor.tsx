"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/components/shared/loading-button";
import { audioUrls, itemContentSchema, type AudioContent, type ItemContent } from "@/lib/validators";
import { AudioPlayer } from "../media/audio-player";

interface EditorProps {
  content: AudioContent;
  onSave: (content: ItemContent) => Promise<void>;
}

type Variant = "PLAYBACK" | "MATCH_AUDIO" | "MATCH_IMAGE";
const VARIANTS: { value: Variant; label: string }[] = [
  { value: "PLAYBACK", label: "Прослушивание" },
  { value: "MATCH_AUDIO", label: "Сопоставить аудио с аудио" },
  { value: "MATCH_IMAGE", label: "Сопоставить аудио с картинкой" },
];

const MAX = 20;
interface Pair {
  left: string;
  right: string;
}

export function AudioEditor({ content, onSave }: EditorProps) {
  const [variant, setVariant] = useState<Variant>(content.variant ?? "PLAYBACK");
  const [prompt, setPrompt] = useState(content.prompt ?? "");
  const [audios, setAudios] = useState<string[]>(audioUrls(content));
  const [pairs, setPairs] = useState<Pair[]>(
    content.pairs?.length ? content.pairs.map((p) => ({ left: p.left, right: p.right })) : [{ left: "", right: "" }, { left: "", right: "" }],
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMatch = variant !== "PLAYBACK";
  const rightIsImage = variant === "MATCH_IMAGE";

  function moveAudio(index: number, dir: -1 | 1) {
    setAudios((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }
  function patchPair(index: number, p: Partial<Pair>) {
    setPairs((prev) => prev.map((x, i) => (i === index ? { ...x, ...p } : x)));
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
    const remaining = MAX - audios.length;
    if (remaining <= 0) {
      toast.error(`Не более ${MAX} записей`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    const next = [...audios];
    try {
      for (const file of selected) {
        const url = await uploadOne(file);
        if (url) next.push(url);
      }
      setAudios(next);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const candidate = isMatch
      ? {
          type: "AUDIO" as const,
          audioUrl: "",
          audios: [],
          variant,
          prompt: prompt.trim() || null,
          pairs: pairs.filter((p) => p.left.trim() !== "" && p.right.trim() !== ""),
        }
      : {
          type: "AUDIO" as const,
          audioUrl: audios[0] ?? "",
          audios,
          variant: "PLAYBACK" as const,
          prompt: null,
          pairs: [],
        };
    const parsed = itemContentSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте аудио");
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
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Вариация:</span>
        <Select value={variant} onValueChange={(v) => setVariant(v as Variant)}>
          <SelectTrigger className="h-8 w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            {VARIANTS.map((v) => (
              <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isMatch ? (
        <>
          {audios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Аудио не загружено.</p>
          ) : (
            <div className="space-y-2">
              {audios.map((url, index) => (
                <div key={`${index}-${url}`} className="flex items-center gap-2 rounded-md border p-2">
                  <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0 flex-1"><AudioPlayer src={url} /></div>
                  <div className="flex shrink-0 flex-col">
                    <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => moveAudio(index, -1)} aria-label="Вверх">
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === audios.length - 1} onClick={() => moveAudio(index, 1)} aria-label="Вниз">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={() => setAudios((prev) => prev.filter((_, i) => i !== index))} aria-label="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.m4a,.wav,.ogg,.aac"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) void handleFiles(files);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading || audios.length >= MAX}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Добавить аудио (можно несколько)
          </Button>
        </>
      ) : (
        <>
          <Input placeholder="Инструкция (необязательно)" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Пары в правильном порядке: слева — аудио, справа — {rightIsImage ? "картинка" : "аудио"}. Ученику правая колонка перемешивается, он расставляет её по порядку.
          </p>
          <div className="space-y-2">
            {pairs.map((pair, index) => (
              <div key={index} className="flex items-start gap-2 rounded-md border p-2">
                <span className="mt-2 w-4 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Аудио (слева)</p>
                    {pair.left ? <AudioPlayer src={pair.left} /> : null}
                    <FileUpload folder="materials" accept=".mp3,.m4a,.wav,.ogg,.aac" value={pair.left || null} onUploaded={(u) => patchPair(index, { left: u ?? "" })} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{rightIsImage ? "Картинка (справа)" : "Аудио (справа)"}</p>
                    {pair.right ? (
                      rightIsImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pair.right} alt="" className="h-16 rounded border object-contain" />
                      ) : (
                        <AudioPlayer src={pair.right} />
                      )
                    ) : null}
                    <FileUpload
                      folder="materials"
                      accept={rightIsImage ? ".jpg,.jpeg,.png,.webp" : ".mp3,.m4a,.wav,.ogg,.aac"}
                      value={pair.right || null}
                      onUploaded={(u) => patchPair(index, { right: u ?? "" })}
                    />
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="mt-1 h-7 w-7 shrink-0 text-destructive" disabled={pairs.length <= 2} onClick={() => setPairs((prev) => prev.filter((_, i) => i !== index))} aria-label="Удалить пару">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setPairs((prev) => (prev.length >= MAX ? prev : [...prev, { left: "", right: "" }]))} disabled={pairs.length >= MAX}>
              <Plus className="h-4 w-4" />
              Пара
            </Button>
          </div>
        </>
      )}

      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
