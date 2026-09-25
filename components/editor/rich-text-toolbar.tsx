"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  Languages,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MessageSquareText,
  Type,
  ALargeSmall,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PinyinInputDialog } from "./pinyin-input-dialog";

const FONTS: { label: string; value: string | null }[] = [
  { label: "Стандартный", value: null },
  { label: "Serif (Georgia)", value: "Georgia, 'Times New Roman', serif" },
  { label: "SimSun 宋体", value: "SimSun, 宋体, serif" },
];

// Sizes are relative (em) so they scale with the surrounding text.
const SIZES: { label: string; value: string | null }[] = [
  { label: "Мельче", value: "0.85em" },
  { label: "Обычный", value: null },
  { label: "Крупнее", value: "1.25em" },
  { label: "Большой", value: "1.5em" },
  { label: "Огромный", value: "2em" },
];

interface UploadResponse {
  url?: string;
  error?: string;
}

// Preset highlight colours (light, so dark text stays readable) — matches the
// note colours / the plain-text FormatBar palette.
const HIGHLIGHTS = ["#fde68a", "#a7f3d0", "#bfdbfe", "#fbcfe8", "#ddd6fe", "#fecaca", "#bbf7d0", "#e5e7eb"];

export function RichTextToolbar({ editor }: { editor: Editor }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pinyinOpen, setPinyinOpen] = useState(false);
  const [pinyinRange, setPinyinRange] = useState<{ from: number; to: number }>({ from: 0, to: 0 });
  const [pinyinCurrent, setPinyinCurrent] = useState("");
  const [colorOpen, setColorOpen] = useState(false);
  const uploadingRef = useRef(false);

  function applyHighlight(color: string) {
    editor.chain().focus().setHighlightColor(color).run();
    setColorOpen(false);
  }
  function clearHighlight() {
    editor.chain().focus().unsetHighlightColor().run();
    setColorOpen(false);
  }

  function addFootnote() {
    if (editor.state.selection.empty) {
      toast.error("Сначала выделите слово или часть текста");
      return;
    }
    const current = (editor.getAttributes("footnote").note as string) ?? "";
    const note = window.prompt("Текст сноски (всплывает при наведении на слово):", current);
    if (note === null) return;
    if (note.trim() === "") editor.chain().focus().unsetFootnote().run();
    else editor.chain().focus().setFootnote(note.trim()).run();
  }

  async function handleImage(file: File) {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "materials");
      const response = await fetch("/api/storage/upload", { method: "POST", body: formData });
      const data = (await response.json()) as UploadResponse;
      if (!response.ok || !data.url) throw new Error(data.error ?? "Не удалось загрузить файл");
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      uploadingRef.current = false;
    }
  }

  function openPinyin() {
    if (editor.state.selection.empty) {
      toast.error("Сначала выделите текст");
      return;
    }
    const { from, to } = editor.state.selection;
    setPinyinRange({ from, to });
    setPinyinCurrent((editor.getAttributes("pinyin").pinyin as string) ?? "");
    setPinyinOpen(true);
  }

  function applyPinyin(value: string) {
    const chain = editor.chain().focus().setTextSelection(pinyinRange);
    if (value) chain.setMark("pinyin", { pinyin: value }).run();
    else chain.unsetMark("pinyin").run();
  }

  function toggleLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Ссылка (URL):", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const btn = (active: boolean) =>
    cn("h-8 w-8", active && "bg-accent text-accent-foreground");

  return (
    <>
    <div className="flex flex-wrap items-center gap-1 border-b p-1">
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Жирный">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Курсив">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Заголовок">
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Маркированный список">
        <List className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Нумерованный список">
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("link"))}
        onClick={toggleLink} aria-label="Ссылка">
        <Link2 className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("pinyin"))}
        onClick={openPinyin} aria-label="Текст над выделением" title="Текст над выделением (транскрипция)">
        <Languages className="h-4 w-4" />
      </Button>
      <div className="relative">
        <Button type="button" size="icon" variant="ghost" className={btn(editor.getAttributes("textStyle").bgColor != null)}
          onClick={() => setColorOpen((o) => !o)} aria-label="Цвет фона" title="Цвет фона выделенного текста">
          <Highlighter className="h-4 w-4" />
        </Button>
        {colorOpen ? (
          <div className="absolute left-0 top-9 z-30 w-max rounded-lg border bg-popover p-2 shadow-lg">
            <div className="grid grid-cols-4 gap-2">
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Цвет ${c}`}
                  className="h-6 w-6 rounded-full border shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  onClick={() => applyHighlight(c)}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1 text-xs text-muted-foreground" title="Любой цвет">
                Свой:
                <input
                  type="color"
                  defaultValue="#fde68a"
                  onChange={(e) => applyHighlight(e.target.value)}
                  className="h-6 w-8 cursor-pointer rounded border bg-background p-0.5"
                />
              </label>
              <button type="button" className="text-xs text-muted-foreground underline hover:text-foreground" onClick={clearHighlight}>
                убрать
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <Button type="button" size="icon" variant="ghost" className={btn(editor.isActive("footnote"))}
        onClick={addFootnote} aria-label="Сноска" title="Сноска: всплывающая заметка при наведении">
        <MessageSquareText className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 px-2" aria-label="Шрифт">
            <Type className="h-4 w-4" />
            Шрифт
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {FONTS.map((font) => (
            <DropdownMenuItem
              key={font.label}
              style={font.value ? { fontFamily: font.value } : undefined}
              onSelect={() => {
                if (font.value) editor.chain().focus().setFontFamily(font.value).run();
                else editor.chain().focus().unsetFontFamily().run();
              }}
            >
              {font.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 px-2" aria-label="Размер шрифта">
            <ALargeSmall className="h-4 w-4" />
            Размер
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {SIZES.map((size) => (
            <DropdownMenuItem
              key={size.label}
              style={size.value ? { fontSize: size.value } : undefined}
              onSelect={() => {
                if (size.value) editor.chain().focus().setFontSize(size.value).run();
                else editor.chain().focus().unsetFontSize().run();
              }}
            >
              {size.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="button" size="icon" variant="ghost" className="h-8 w-8"
        onClick={() => inputRef.current?.click()} aria-label="Вставить изображение">
        {uploadingRef.current ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImage(file);
          e.target.value = "";
        }}
      />
    </div>
    <PinyinInputDialog open={pinyinOpen} defaultValue={pinyinCurrent} onOpenChange={setPinyinOpen} onConfirm={applyPinyin} />
    </>
  );
}
