"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";

import { cn } from "@/lib/utils";
import { RichTextToolbar } from "./rich-text-toolbar";
import { Pinyin } from "./pinyin-mark";
import { FontSize } from "./font-size";
import { HighlightColor } from "./highlight-color";
import { Footnote } from "./footnote-mark";
import { PinyinSelection } from "./pinyin-selection";

interface RichTextEditorProps {
  value: Record<string, unknown>;
  onChange: (doc: Record<string, unknown>) => void;
  onReady?: (editor: Editor) => void;
  className?: string;
}

export function RichTextEditor({ value, onChange, onReady, className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      TextStyle,
      FontFamily,
      FontSize,
      HighlightColor,
      Footnote,
      Pinyin,
    ],
    content: value as JSONContent,
    editorProps: {
      attributes: {
        class: cn(
          "pinyin-content min-h-[160px] px-3 py-2 text-sm focus:outline-none",
          "[&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_a]:text-primary [&_a]:underline",
          "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
        ),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as Record<string, unknown>),
  });

  // Hand the live editor to the parent so it can read the latest JSON at save
  // time (the onChange-mirrored state can lag a just-applied command).
  useEffect(() => {
    if (editor) onReady?.(editor);
  }, [editor, onReady]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border", className)} data-build="pinyin-save-live">
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
      <PinyinSelection editor={editor} />
    </div>
  );
}
