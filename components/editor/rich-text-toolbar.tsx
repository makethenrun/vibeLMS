"use client";

import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Type,
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

const FONTS: { label: string; value: string | null }[] = [
  { label: "Стандартный", value: null },
  { label: "Serif (Georgia)", value: "Georgia, 'Times New Roman', serif" },
  { label: "SimSun 宋体", value: "SimSun, 宋体, serif" },
];

interface UploadResponse {
  url?: string;
  error?: string;
}

export function RichTextToolbar({ editor }: { editor: Editor }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

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
  );
}
