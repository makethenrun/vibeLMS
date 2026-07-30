"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

import { cn } from "@/lib/utils";
import { RichTextToolbar } from "./rich-text-toolbar";

interface RichTextEditorProps {
  value: Record<string, unknown>;
  onChange: (doc: Record<string, unknown>) => void;
  className?: string;
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
    ],
    content: value as JSONContent,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[160px] px-3 py-2 text-sm focus:outline-none",
          "[&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_a]:text-primary [&_a]:underline",
          "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
        ),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as Record<string, unknown>),
  });

  // Keep the editor in sync if the incoming value changes identity (e.g. reset).
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border", className)}>
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
