"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";

import { cn } from "@/lib/utils";

export function InfoView({ doc }: { doc: Record<string, unknown> }) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: [StarterKit, Link.configure({ openOnClick: true }), Image, TextStyle, FontFamily],
    content: doc as JSONContent,
    editorProps: {
      attributes: {
        class: cn(
          "text-sm focus:outline-none",
          "[&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_a]:text-primary [&_a]:underline",
          "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
        ),
      },
    },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
